/**
 * lib/announcements/feed.js
 *
 * Bridges published company announcements into the news feed pipeline so they
 * appear in investors' and individuals' personalized "For You" feeds, ranked
 * by the same rank_news_for_user() logic — matched by sector and boosted for
 * anyone tracking the company (via a news_entities company link).
 *
 * Each announcement maps to exactly one news_articles row, keyed by a stable
 * url_hash ("ann-<id>") so it can be removed on retract/takedown.
 */

import { buildArticleEmbeddingText, embedText } from "@/lib/news/embeddings";

const CAT_CLASS = {
  raise_open: "funding", raise_close: "funding", partnership: "partnership",
  product: "product", hire: "leadership_change", milestone: "product",
  award: "other", expansion: "other", other: "other",
};

const sectorTags = (industry_tags) =>
  (industry_tags || []).slice(0, 5).map((t) => String(t).replace(/_/g, "-"));

// Get (or create) the synthetic "EP Network" source used for announcements.
async function ensureSource(supabase) {
  const slug = "ep-network-announcements";
  const { data: existing } = await supabase.from("news_sources").select("id").eq("slug", slug).maybeSingle();
  if (existing) return existing.id;
  const { data } = await supabase.from("news_sources").insert({
    name: "EP Network", slug, feed_url: "https://epinvesting.com/announcements",
    feed_type: "api", category: "press_release", credibility_tier: 1,
    attribution_label: "Announced on EP Network", active: false,
  }).select("id").single();
  return data?.id || null;
}

function summarize(company, ann) {
  const m = ann.meta || {};
  const bits = [];
  if (m.amount_usd) bits.push(`$${Number(m.amount_usd).toLocaleString()}`);
  if (m.round_type) bits.push(m.round_type);
  if (m.lead_investor) bits.push(`led by ${m.lead_investor}`);
  if (m.partner_name) bits.push(`with ${m.partner_name}`);
  if (m.person_name) bits.push(`${m.person_name}${m.role ? `, ${m.role}` : ""}`);
  const lead = bits.length ? bits.join(" · ") + ". " : "";
  return `${lead}${ann.body || ""}`.trim() || ann.title;
}

export async function pushAnnouncementToFeed(supabase, company, ann) {
  const sourceId = await ensureSource(supabase);
  if (!sourceId) return null;

  const classification = CAT_CLASS[ann.category] || "other";
  const tags = sectorTags(company.industry_tags);
  const summary = summarize(company, ann);
  const url = ann.link_url || `https://epinvesting.com/companies/${company.id}`;
  const url_hash = `ann-${ann.id}`;

  let embedding = null;
  try {
    embedding = await embedText(buildArticleEmbeddingText({
      title: ann.title, summary_factual: summary, excerpt: summary,
      classification, sector_tags: tags, geography_tags: [],
    }));
  } catch { /* non-fatal — ranking degrades to recency + pipeline match */ }

  const row = {
    source_id: sourceId,
    url, url_hash,
    title: `${company.name}: ${ann.title}`,
    excerpt: summary.slice(0, 400),
    clean_content: summary,
    summary_factual: summary,
    classification,
    sector_tags: tags,
    geography_tags: [],
    deal_size_usd: ann.meta?.amount_usd ? Number(ann.meta.amount_usd) : null,
    published_at: ann.published_at || new Date().toISOString(),
    enrichment_status: "done",
    quality_score: 0.7,
  };
  if (embedding) row.embedding = embedding;

  const { data, error } = await supabase.from("news_articles")
    .upsert(row, { onConflict: "url_hash" }).select("id").single();
  if (error || !data) return null;

  // Link the company so the pipeline-match boost fires for users tracking it.
  await supabase.from("news_entities").delete().eq("article_id", data.id);
  await supabase.from("news_entities").insert({ article_id: data.id, entity_type: "company", entity_name: company.name });
  return data.id;
}

export async function removeAnnouncementFromFeed(supabase, annId) {
  const url_hash = `ann-${annId}`;
  const { data } = await supabase.from("news_articles").select("id").eq("url_hash", url_hash).maybeSingle();
  if (data?.id) {
    await supabase.from("news_entities").delete().eq("article_id", data.id);
    await supabase.from("news_articles").delete().eq("id", data.id);
  }
}
