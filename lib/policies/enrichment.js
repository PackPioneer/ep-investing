/**
 * lib/policies/enrichment.js
 *
 * AI enrichment for policies. Produces two things per policy:
 *
 *   1. Structured extraction (Haiku): sectors affected, company types
 *      affected, refined status, dates. Output is JSON we merge back onto
 *      the policies row.
 *
 *   2. Investor implications (Sonnet): 2-3 paragraph plain-English
 *      summary answering "what does this mean for climate investors and
 *      their portfolio companies?"
 *
 * Same execution pattern as lib/news/enrichment.js — two parallel calls,
 * write both, mark done. Failure tolerant (marks 'failed' with error
 * message for retry).
 */

import Anthropic from '@anthropic-ai/sdk';

const HAIKU_MODEL = 'claude-haiku-4-5-20251001';
const SONNET_MODEL = 'claude-sonnet-4-6';
const MAX_CONTENT_CHARS = 10_000;

const VALID_STATUSES = [
  'proposed',
  'comment_period',
  'enacted',
  'enacted_pending_effective',
  'in_force',
  'amended',
  'withdrawn',
  'superseded',
  'notice',
  'unknown',
];

const SECTOR_TAGS = [
  'solar', 'wind-energy', 'battery-storage', 'grid-storage', 'green-hydrogen',
  'ev-charging', 'electric-vehicles', 'carbon-credits', 'direct-air-capture',
  'saf-efuels', 'electric-aviation', 'nuclear-technologies', 'geothermal-energy',
  'clean-cooking', 'industrial-decarbonization', 'buildings-efficiency',
  'transmission', 'clean-heat', 'methane', 'air-quality', 'water', 'waste',
  'permitting', 'tax-incentives', 'disclosure', 'environmental-justice',
];

const COMPANY_TYPES = [
  'project_developer',
  'utility',
  'manufacturer',
  'technology_provider',
  'financier_or_investor',
  'consultant_advisor',
  'commercial_operator',
  'research_institute',
];

let _client = null;
function getClient() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
  _client = new Anthropic({ apiKey });
  return _client;
}

function prepareAbstract(policy) {
  const abstract = policy.abstract ?? '';
  const rawText = policy.raw_payload?.full_text_xml_url
    ? null  // we don't fetch full XML bodies — abstract is enough for summaries
    : null;
  return (abstract || policy.title || '').slice(0, MAX_CONTENT_CHARS);
}

function buildExtractionPrompt(policy) {
  return `You are an analyst extracting structured data from a climate/energy policy document.

Policy title: ${policy.title}
Jurisdiction: ${policy.jurisdiction ?? 'unknown'}
Agency: ${policy.agency ?? 'unknown'}
Document type: ${policy.document_type ?? 'unknown'}
Published: ${policy.published_at ?? 'unknown'}
Effective date: ${policy.effective_date ?? 'unknown'}
Abstract:
${prepareAbstract(policy)}

Return a single JSON object with these fields:
{
  "status": one of ${JSON.stringify(VALID_STATUSES)},
  "sector_tags": array of 0-5 tags from ${JSON.stringify(SECTOR_TAGS)},
  "affected_company_types": array of 0-4 from ${JSON.stringify(COMPANY_TYPES)},
  "is_climate_relevant": true or false (false if this is routine admin with no climate impact)
}

Rules:
- Choose status based on where the policy is in its lifecycle. "proposed" = drafted/published for proposal. "comment_period" = open for public comment. "enacted" = finalized but not yet in force. "in_force" = currently active. "notice" = informational, not rule-making.
- If the document is not climate/energy relevant (e.g. unrelated EPA action on lead paint in schools), set is_climate_relevant=false. We'll skip enrichment for those.
- Return only the JSON, no markdown fences, no prose.`;
}

function buildImplicationsPrompt(policy) {
  return `You are summarizing a climate/energy policy for a sophisticated investor audience that already understands the industry.

Policy title: ${policy.title}
Jurisdiction: ${policy.jurisdiction ?? 'unknown'}
Agency: ${policy.agency ?? 'unknown'}
Document type: ${policy.document_type ?? 'unknown'}
Published: ${policy.published_at ?? 'unknown'}
Effective date: ${policy.effective_date ?? 'none specified'}
Abstract:
${prepareAbstract(policy)}

Write a 2-3 paragraph plain-English analysis covering:
- What the policy actually does, in one clear sentence
- Which climate-tech sectors or business models are most affected and how
- Key dates investors should know (effective date, comment deadlines, implementation milestones)

Constraints:
- Factual and neutral. No speculation about whether the policy is good or bad. No political framing.
- No hedge words like "may", "could", "potentially" unless the underlying policy genuinely is conditional.
- Write for someone who already knows what the IRA, FERC, and NEPA are — skip basic context.
- Under 180 words total.
- Output just the analysis text, no headings or bullet points.`;
}

function textFromResponse(response) {
  const block = response?.content?.find((b) => b.type === 'text');
  return block?.text ?? '';
}

function parseExtraction(raw) {
  const cleaned = String(raw ?? '')
    .trim()
    .replace(/^```(?:json)?\s*/, '')
    .replace(/\s*```$/, '')
    .trim();
  const parsed = JSON.parse(cleaned);

  if (!VALID_STATUSES.includes(parsed.status)) parsed.status = 'unknown';
  parsed.sector_tags = Array.isArray(parsed.sector_tags)
    ? parsed.sector_tags.filter((t) => SECTOR_TAGS.includes(t)).slice(0, 5)
    : [];
  parsed.affected_company_types = Array.isArray(parsed.affected_company_types)
    ? parsed.affected_company_types.filter((t) => COMPANY_TYPES.includes(t)).slice(0, 4)
    : [];
  parsed.is_climate_relevant = parsed.is_climate_relevant !== false;
  return parsed;
}

export async function enrichPolicy(policy) {
  const anthropic = getClient();
  const content = prepareAbstract(policy);
  if (content.length < 30) {
    return {
      _skipped_reason: 'no_content',
      is_climate_relevant: false,
    };
  }

  // First run the cheap extraction. If it says not climate-relevant we
  // skip the Sonnet call entirely and mark the policy 'skipped'.
  const extractionResp = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 512,
    messages: [{ role: 'user', content: buildExtractionPrompt(policy) }],
  });
  const extraction = parseExtraction(textFromResponse(extractionResp));

  if (!extraction.is_climate_relevant) {
    return { ...extraction, investor_implications: null };
  }

  // Climate relevant: run Sonnet for the prose summary
  const implicationsResp = await anthropic.messages.create({
    model: SONNET_MODEL,
    max_tokens: 500,
    messages: [{ role: 'user', content: buildImplicationsPrompt(policy) }],
  });
  const implications = textFromResponse(implicationsResp).trim();

  return {
    ...extraction,
    investor_implications: implications,
  };
}

/**
 * Process up to `limit` pending policies. Same pattern as news enrichment:
 * mark in_progress, enrich, update row, mark done or failed.
 */
export async function enrichPendingPolicies(supabase, { limit = 20, concurrency = 3 } = {}) {
  const stats = { processed: 0, succeeded: 0, skipped: 0, failed: 0, errors: [] };

  const { data: policies, error } = await supabase
    .from('policies')
    .select('id, title, abstract, jurisdiction, agency, document_type, published_at, effective_date, status, raw_payload, enrichment_attempts')
    .eq('enrichment_status', 'pending')
    .lt('enrichment_attempts', 3)
    .order('published_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    stats.errors.push({ message: `Fetch pending failed: ${error.message}` });
    return stats;
  }

  if (!policies || policies.length === 0) return stats;

  for (let i = 0; i < policies.length; i += concurrency) {
    const batch = policies.slice(i, i + concurrency);
    await Promise.all(batch.map(async (policy) => {
      stats.processed += 1;

      await supabase.from('policies').update({
        enrichment_status: 'in_progress',
        enrichment_attempts: (policy.enrichment_attempts ?? 0) + 1,
      }).eq('id', policy.id);

      try {
        const enriched = await enrichPolicy(policy);

        const update = {
          enrichment_status: enriched.is_climate_relevant === false ? 'skipped' : 'done',
          enrichment_error: null,
        };

        if (enriched.is_climate_relevant !== false) {
          if (enriched.status) update.status = enriched.status;
          if (enriched.sector_tags?.length) update.sectors = enriched.sector_tags;
          if (enriched.affected_company_types?.length) {
            update.affected_company_types = enriched.affected_company_types;
          }
          if (enriched.investor_implications) {
            update.investor_implications = enriched.investor_implications;
          }
        }

        const { error: updateErr } = await supabase
          .from('policies')
          .update(update)
          .eq('id', policy.id);

        if (updateErr) throw new Error(`DB update: ${updateErr.message}`);

        if (update.enrichment_status === 'skipped') stats.skipped += 1;
        else stats.succeeded += 1;
      } catch (err) {
        stats.failed += 1;
        stats.errors.push({ policy_id: policy.id, message: err.message });
        await supabase.from('policies').update({
          enrichment_status: 'failed',
          enrichment_error: String(err.message).slice(0, 500),
        }).eq('id', policy.id);
      }
    }));
  }

  return stats;
}
