/**
 * scripts/reclassify-articles.js
 *
 * Runs Haiku over already-enriched articles to update just the
 * classification, geography_tags, and sector_tags fields using the
 * updated prompt. Does NOT re-summarize (existing summaries are fine)
 * so cost is roughly 1/4 of full enrichment.
 *
 * Cost estimate: Haiku at $1/MTok input, $5/MTok output.
 * ~400 input tokens + ~80 output tokens per article = 0.4 cents each.
 * For 212 articles: about $0.85.
 *
 *   node scripts/reclassify-articles.js
 *
 * Options (via env):
 *   BATCH=20       articles per parallel round
 *   MAX=500        hard cap total
 *   SINCE_DAYS=60  only process articles from the last N days (0 = all)
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import { buildExtractionPrompt, CLASSIFICATIONS } from '../lib/news/prompts.js';

dotenv.config({ path: '.env.local' });

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const MAX_CONTENT_CHARS = 12_000;
const BATCH = parseInt(process.env.BATCH ?? '20', 10);
const MAX = process.env.MAX ? parseInt(process.env.MAX, 10) : Infinity;
const SINCE_DAYS = parseInt(process.env.SINCE_DAYS ?? '60', 10);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

let anthropic = null;
function getAnthropic() {
  if (anthropic) return anthropic;
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n').replace(/[ \t]+/g, ' ')
    .trim();
}

function prepareContent(article) {
  const source = article.clean_content || article.raw_content || article.summary_factual || article.excerpt || '';
  const cleaned = article.clean_content ? source : stripHtml(source);
  return cleaned.slice(0, MAX_CONTENT_CHARS);
}

function parseExtraction(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
  const parsed = JSON.parse(cleaned);

  if (!CLASSIFICATIONS.includes(parsed.classification)) {
    parsed.classification = 'other';
  }
  parsed.geography_tags = Array.isArray(parsed.geography_tags)
    ? parsed.geography_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
  parsed.sector_tags = Array.isArray(parsed.sector_tags)
    ? parsed.sector_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
  return parsed;
}

function textFromResponse(response) {
  const block = response?.content?.find((b) => b.type === 'text');
  return block?.text ?? '';
}

async function reclassifyOne(article) {
  const client = getAnthropic();
  const content = prepareContent(article);
  if (content.length < 50) return null;

  const resp = await client.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    messages: [{
      role: 'user',
      content: buildExtractionPrompt({
        title: article.title,
        source: article.source?.name ?? 'unknown',
        publishedAt: article.published_at,
        content,
      }),
    }],
  });

  return parseExtraction(textFromResponse(resp));
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Missing ANTHROPIC_API_KEY');
    process.exit(1);
  }

  // Fetch candidate articles
  let query = supabase
    .from('news_articles')
    .select('id, title, excerpt, summary_factual, raw_content, clean_content, published_at, classification, source:news_sources(name)')
    .eq('enrichment_status', 'done')
    .order('published_at', { ascending: false, nullsFirst: false });

  if (SINCE_DAYS > 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - SINCE_DAYS);
    query = query.gte('published_at', cutoff.toISOString());
  }

  const { data: articles, error } = await query;
  if (error) {
    console.error('Fetch failed:', error.message);
    process.exit(1);
  }

  const target = Math.min(articles.length, MAX);
  console.log(`Re-classifying ${target} articles (${SINCE_DAYS > 0 ? `last ${SINCE_DAYS} days` : 'all time'}) in parallel batches of ${BATCH}.\n`);

  const classCounts = {};
  const changeCounts = { changed: 0, unchanged: 0, failed: 0 };
  let round = 0;
  const startTime = Date.now();

  for (let i = 0; i < target; i += BATCH) {
    round += 1;
    const batch = articles.slice(i, Math.min(i + BATCH, target));
    const batchStart = Date.now();

    await Promise.all(batch.map(async (article) => {
      try {
        const result = await reclassifyOne(article);
        if (!result) {
          changeCounts.failed += 1;
          return;
        }

        classCounts[result.classification] = (classCounts[result.classification] ?? 0) + 1;

        const changed = result.classification !== article.classification;
        if (changed) changeCounts.changed += 1;
        else changeCounts.unchanged += 1;

        const { error: updateErr } = await supabase
          .from('news_articles')
          .update({
            classification: result.classification,
            geography_tags: result.geography_tags,
            sector_tags: result.sector_tags,
          })
          .eq('id', article.id);

        if (updateErr) {
          changeCounts.failed += 1;
          console.log(`  ! article ${article.id}: ${updateErr.message}`);
        }
      } catch (err) {
        changeCounts.failed += 1;
        console.log(`  ! article ${article.id}: ${err.message}`);
      }
    }));

    const batchDur = ((Date.now() - batchStart) / 1000).toFixed(1);
    const done = Math.min(i + BATCH, target);
    console.log(`  Round ${round} (${batchDur}s): processed ${done}/${target} — ${changeCounts.changed} reclassified, ${changeCounts.unchanged} unchanged, ${changeCounts.failed} failed`);
  }

  const totalDur = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\nDone in ${totalDur}s:`);
  console.log(`  Changed classification:   ${changeCounts.changed}`);
  console.log(`  Unchanged:                ${changeCounts.unchanged}`);
  console.log(`  Failed:                   ${changeCounts.failed}`);
  console.log(`\nClassification distribution:`);
  for (const [cls, count] of Object.entries(classCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cls.padEnd(20)} ${count}`);
  }
}

main().catch((err) => {
  console.error('Reclassification failed:', err);
  process.exit(1);
});
