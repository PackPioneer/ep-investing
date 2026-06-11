/**
 * app/api/admin/generate-candidates/route.js
 *
 * Assisted-curation candidate generator (news-mining source).
 *
 * Scans recently-enriched news articles whose classification already marks them
 * as event-like, asks Haiku to judge strip-worthiness and draft a clean
 * briefing-strip item, and inserts positives into candidate_feed_items with
 * status='pending'. Admin then reviews/approves in the queue UI.
 *
 * POST /api/admin/generate-candidates           → process last 2 days
 * POST /api/admin/generate-candidates  body { days: 3, limit: 100 }
 *
 * Nothing here is shown to end users. It only fills the review queue.
 *
 * Reuses the house pattern from lib/news/enrichment.js: getAnthropic(),
 * HAIKU_MODEL, fenced-JSON parsing, bounded concurrency.
 */

import Anthropic from '@anthropic-ai/sdk';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';

// Classifications that are worth considering as strip events. Everything else
// (other/product/market/earnings) is skipped before any model call.
const EVENT_CLASSIFICATIONS = [
  'funding', 'fund_close', 'ipo', 'policy', 'regulatory',
  'm_and_a', 'partnership', 'leadership_change',
];

// classification -> strip category default (the model can override).
const CATEGORY_HINT = {
  funding: 'capital',
  fund_close: 'capital',
  ipo: 'capital',
  policy: 'policy',
  regulatory: 'policy',
  m_and_a: 'industry',
  partnership: 'industry',
  leadership_change: 'industry',
};

const VALID_CATEGORIES = ['capital', 'grant', 'policy', 'industry'];

let _client = null;
function getAnthropic() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

function textFromResponse(response) {
  const block = response?.content?.find((b) => b.type === 'text');
  return block?.text ?? '';
}

function parseDraft(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

function buildDraftPrompt(article) {
  return `You curate a "this just in" briefing strip for climate-company founders. They want a glanceable snapshot of events that change their world: capital availability, grants, policy/regulation, and notable industry moves.

Here is an enriched news article. Decide whether it describes a DISCRETE, NOTABLE EVENT worth putting in front of every climate founder this morning — not general commentary, analysis, or a minor mention.

Article:
- Title: ${article.title}
- Summary: ${article.summary_factual || article.excerpt || ''}
- Classification: ${article.classification}
- Sector tags: ${(article.sector_tags || []).join(', ') || 'none'}
- Deal size (USD, if any): ${article.deal_size_usd ?? 'none'}

Respond with ONLY a JSON object, no prose, no code fences:
{
  "is_strip_worthy": boolean,        // false for commentary, roundups, minor or stale items
  "category": "capital" | "grant" | "policy" | "industry",
  "title": string,                   // crisp headline, <= 90 chars, event-first (e.g. "Breakthrough Energy opens $500M climate fund")
  "body": string,                    // ONE sentence of context, <= 160 chars
  "importance": 1 | 2 | 3,           // 3 = every founder should see it (major fund, sweeping policy); 2 = notable; 1 = minor
  "entity_name": string | null,      // the primary org the event is about, or null (e.g. policy with no single org)
  "entity_kind": "company" | "ngo" | "investor" | null,
  "topics": string[],                // sector tag slugs that apply, from the article's tags
  "dedup_signature": string          // short normalized key: lowercase entity + event-type + month, e.g. "breakthrough-energy|fund_close|2026-06"
}

Be conservative: when in doubt, set is_strip_worthy=false. A short, high-signal strip beats a noisy one.`;
}



export async function POST(req) {
  const userId = await requireAdmin();
  if (!userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );

  let body = {};
  try {
    body = await req.json();
  } catch {
    /* empty body is fine */
  }
  const days = Number.isFinite(body?.days) && body.days > 0 ? Math.min(body.days, 14) : 2;
  const limit = Number.isFinite(body?.limit) && body.limit > 0 ? Math.min(body.limit, 200) : 100;

  // Pull candidate articles: enriched, recent, event-classified, and not already
  // turned into a candidate (avoid reprocessing the same article).
  const { data: existing } = await supabase
    .from('candidate_feed_items')
    .select('source_article_id')
    .not('source_article_id', 'is', null);
  const alreadyProcessed = new Set((existing || []).map((r) => r.source_article_id));

  const { data: articles, error: artErr } = await supabase
    .from('news_articles')
    .select('id, title, summary_factual, excerpt, classification, sector_tags, deal_size_usd, published_at')
    .eq('enrichment_status', 'done')
    .in('classification', EVENT_CLASSIFICATIONS)
    .gt('published_at', new Date(Date.now() - days * 86400000).toISOString())
    .order('published_at', { ascending: false })
    .limit(limit);

  if (artErr) {
    return NextResponse.json({ error: 'Article query failed', detail: artErr.message }, { status: 500 });
  }

  const toProcess = (articles || []).filter((a) => !alreadyProcessed.has(a.id));
  const anthropic = getAnthropic();
  const stats = { considered: toProcess.length, created: 0, skipped_not_worthy: 0, skipped_dupe: 0, errors: 0 };

  const concurrency = 5;
  for (let i = 0; i < toProcess.length; i += concurrency) {
    const chunk = toProcess.slice(i, i + concurrency);
    await Promise.all(
      chunk.map(async (article) => {
        try {
          const resp = await anthropic.messages.create({
            model: HAIKU_MODEL,
            max_tokens: 512,
            messages: [{ role: 'user', content: buildDraftPrompt(article) }],
          });
          const draft = parseDraft(textFromResponse(resp));
          if (!draft || draft.is_strip_worthy !== true) {
            stats.skipped_not_worthy += 1;
            return;
          }

          const category = VALID_CATEGORIES.includes(draft.category)
            ? draft.category
            : (CATEGORY_HINT[article.classification] || 'industry');
          const importance = [1, 2, 3].includes(draft.importance) ? draft.importance : 2;

          // Resolve entity_id if the model named a company/ngo/investor we know.
          let entity_type = null;
          let entity_id = null;
          if (draft.entity_name && draft.entity_kind === 'company') {
            const { data: match } = await supabase
              .from('companies')
              .select('id')
              .ilike('name', draft.entity_name)
              .maybeSingle();
            if (match) { entity_type = 'company'; entity_id = match.id; }
          }
          // (ngo/investor resolution can be added the same way later.)

          const insertRow = {
            category,
            title: (draft.title || article.title || '').slice(0, 200),
            body: (draft.body || '').slice(0, 400),
            link_url: null,
            entity_type,
            entity_id,
            topics: Array.isArray(draft.topics) ? draft.topics.slice(0, 6) : (article.sector_tags || []).slice(0, 6),
            geography_tags: [],
            importance,
            status: 'pending',
            candidate_source: 'news_mining',
            confidence: typeof draft.confidence === 'number' ? draft.confidence : null,
            source_article_id: article.id,
            dedup_key: draft.dedup_signature ? String(draft.dedup_signature).slice(0, 200) : null,
          };

          const { error: insErr } = await supabase
            .from('candidate_feed_items')
            .insert(insertRow);

          if (insErr) {
            // Unique violation on dedup_key => same event already queued. Not an error.
            if (insErr.code === '23505') { stats.skipped_dupe += 1; }
            else { stats.errors += 1; console.error('Candidate insert failed:', insErr.message); }
            return;
          }
          stats.created += 1;
        } catch (err) {
          stats.errors += 1;
          console.error(`Candidate generation failed for article ${article.id}:`, err.message);
        }
      })
    );
  }

  return NextResponse.json({ ok: true, ...stats });
}
