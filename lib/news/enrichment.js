/**
 * lib/news/enrichment.js
 *
 * Phase 3B update: now generates an OpenAI embedding for each article in
 * addition to the Haiku/Sonnet structured+prose enrichment from Phase 2.
 *
 * The three API calls (Haiku, Sonnet, OpenAI embeddings) run in parallel
 * since they're independent. Embedding failure doesn't block enrichment —
 * the article is still marked 'done' if summary and structured data
 * succeeded; we just log the embedding failure and move on.
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  buildExtractionPrompt,
  buildSummaryPrompt,
  CLASSIFICATIONS,
} from './prompts.js';
import { buildArticleEmbeddingText, embedText } from './embeddings.js';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';
const MAX_CONTENT_CHARS = 12000;

let _client = null;
function getAnthropic() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function prepareContent(article) {
  const source = article.clean_content || article.raw_content || article.excerpt || '';
  const cleaned = article.clean_content ? source : stripHtml(source);
  return cleaned.slice(0, MAX_CONTENT_CHARS);
}

function parseExtraction(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty extraction response');
  }
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    throw new Error(`Extraction JSON parse failed: ${err.message}`);
  }

  if (!CLASSIFICATIONS.includes(parsed.classification)) {
    parsed.classification = 'other';
  }

  parsed.geography_tags = Array.isArray(parsed.geography_tags)
    ? parsed.geography_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];
  parsed.sector_tags = Array.isArray(parsed.sector_tags)
    ? parsed.sector_tags.filter((t) => typeof t === 'string' && t.length > 0).slice(0, 6)
    : [];

  const ENTITY_TYPE_MAP = {
    company: 'company', corporation: 'company', startup: 'company', firm: 'company', organization: 'company',
    person: 'person', people: 'person', individual: 'person',
    policy: 'policy', legislation: 'policy', regulation: 'policy', law: 'policy', bill: 'policy',
      treaty: 'policy', initiative: 'policy', program: 'policy',
    agency: 'agency', department: 'agency', ministry: 'agency', government: 'agency', regulator: 'agency',
    fund: 'fund', investor: 'fund', vc: 'fund', investment_fund: 'fund', fund_manager: 'fund',
  };
  parsed.entities = Array.isArray(parsed.entities)
    ? parsed.entities
        .filter((e) => e && typeof e.name === 'string' && typeof e.type === 'string')
        .map((e) => ({
          type: ENTITY_TYPE_MAP[e.type.toLowerCase().replace(/[\s-]/g, '_')] ?? null,
          name: e.name,
        }))
        .filter((e) => e.type !== null)
        .slice(0, 10)
    : [];

  if (parsed.deal_size_usd !== null && parsed.deal_size_usd !== undefined) {
    const n = Number(parsed.deal_size_usd);
    parsed.deal_size_usd = Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  } else {
    parsed.deal_size_usd = null;
  }

  return parsed;
}

function textFromResponse(response) {
  const block = response?.content?.find((b) => b.type === 'text');
  return block?.text ?? '';
}

export async function enrichArticle(article) {
  const anthropic = getAnthropic();
  const content = prepareContent(article);

  if (content.length < 50) {
    return {
      summary_factual: article.excerpt ?? article.title,
      classification: 'other',
      geography_tags: [],
      sector_tags: [],
      deal_size_usd: null,
      entities: [],
      embedding: null,
      _skipped_reason: 'insufficient_content',
    };
  }

  const commonArgs = {
    title: article.title,
    source: article.source_name ?? 'unknown',
    publishedAt: article.published_at ?? null,
    content,
  };

  // Parallel: Haiku (structured) + Sonnet (summary).
  // Embedding is generated AFTER we have the summary since we use it as input.
  const [extractionResp, summaryResp] = await Promise.all([
    anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: buildExtractionPrompt(commonArgs) }],
    }),
    anthropic.messages.create({
      model: SONNET_MODEL,
      max_tokens: 400,
      messages: [{ role: 'user', content: buildSummaryPrompt(commonArgs) }],
    }),
  ]);

  const extraction = parseExtraction(textFromResponse(extractionResp));
  const summary = textFromResponse(summaryResp).trim();

  // Generate embedding from the enriched data. Uses summary + tags so the
  // embedding reflects our understanding of the article, not the raw RSS.
  // Failure is non-fatal — article still gets marked 'done'.
  let embedding = null;
  try {
    const embeddingText = buildArticleEmbeddingText({
      title: article.title,
      summary_factual: summary,
      excerpt: article.excerpt,
      classification: extraction.classification,
      sector_tags: extraction.sector_tags,
      geography_tags: extraction.geography_tags,
    });
    embedding = await embedText(embeddingText);
  } catch (err) {
    console.warn(`Embedding generation failed for "${article.title}": ${err.message}`);
  }

  return {
    summary_factual: summary,
    classification: extraction.classification,
    geography_tags: extraction.geography_tags,
    sector_tags: extraction.sector_tags,
    deal_size_usd: extraction.deal_size_usd,
    entities: extraction.entities,
    embedding,
  };
}

export async function enrichBatch(articles, supabase, { concurrency = 5 } = {}) {
  const stats = { processed: 0, succeeded: 0, failed: 0, embedded: 0, errors: [] };
  if (!articles || articles.length === 0) return stats;

  for (let i = 0; i < articles.length; i += concurrency) {
    const chunk = articles.slice(i, i + concurrency);

    await Promise.all(
      chunk.map(async (article) => {
        stats.processed += 1;

        await supabase
          .from('news_articles')
          .update({
            enrichment_status: 'in_progress',
            enrichment_attempts: (article.enrichment_attempts ?? 0) + 1,
          })
          .eq('id', article.id);

        try {
          const enriched = await enrichArticle(article);

          const updatePayload = {
            summary_factual: enriched.summary_factual,
            classification: enriched.classification,
            geography_tags: enriched.geography_tags,
            sector_tags: enriched.sector_tags,
            deal_size_usd: enriched.deal_size_usd,
            enrichment_status: 'done',
            enrichment_error: null,
          };

          if (enriched.embedding) {
            updatePayload.embedding = enriched.embedding;
            stats.embedded += 1;
          }

          const { error: updateError } = await supabase
            .from('news_articles')
            .update(updatePayload)
            .eq('id', article.id);

          if (updateError) throw new Error(`DB update: ${updateError.message}`);

          if (enriched.entities.length > 0) {
            const entityRows = enriched.entities.map((e) => ({
              article_id: article.id,
              entity_type: e.type,
              entity_name: e.name,
            }));
            const { error: entityError } = await supabase
              .from('news_entities')
              .insert(entityRows);
            if (entityError) {
              console.warn(
                `Entity insert for article ${article.id} failed: ${entityError.message}`
              );
            }
          }

          stats.succeeded += 1;
        } catch (err) {
          stats.failed += 1;
          stats.errors.push({ article_id: article.id, message: err.message });
          await supabase
            .from('news_articles')
            .update({
              enrichment_status: 'failed',
              enrichment_error: String(err.message).slice(0, 500),
            })
            .eq('id', article.id);
        }
      })
    );
  }

  return stats;
}

export async function enrichPending(supabase, { limit = 30, concurrency = 5 } = {}) {
  const { data: articles, error } = await supabase
    .from('news_articles')
    .select(`
      id, title, excerpt, raw_content, clean_content, published_at,
      enrichment_attempts,
      source:news_sources ( name )
    `)
    .eq('enrichment_status', 'pending')
    .lt('enrichment_attempts', 3)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return {
      processed: 0, succeeded: 0, failed: 0, embedded: 0,
      errors: [{ message: `Fetch pending: ${error.message}` }],
    };
  }

  const flat = (articles ?? []).map((a) => ({
    ...a,
    source_name: a.source?.name ?? 'unknown',
  }));

  return enrichBatch(flat, supabase, { concurrency });
}
