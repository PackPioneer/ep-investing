/**
 * lib/news/user-embeddings.js
 *
 * Refreshes user interest embeddings. Called from:
 *   - The daily cron route (refresh-user-embeddings) — refreshes all users
 *     whose preferences have changed since last embed
 *   - Manually via the API when a user saves their profile (optional;
 *     cron will catch up within 24h anyway)
 *
 * Data sources combined for an investor's text:
 *   - user_news_preferences.sectors / geographies
 *   - Investor profile thesis / focus (if available — your schema splits
 *     these across philanthropic_investors, angel_syndicates, vc_firms)
 *
 * For company users:
 *   - companies.industry_tags and target_geographies
 *   - Company description / business model
 */

import { buildUserEmbeddingText, embedText } from './embeddings.js';

/**
 * Load the user's preferences + any investor/company profile data we can
 * pull. Returns a dict of fields ready for buildUserEmbeddingText.
 */
async function loadUserContext(supabase, clerkUserId) {
  const { data: prefs } = await supabase
    .from('user_news_preferences')
    .select('sectors, geographies')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  const ctx = {
    sectors: prefs?.sectors ?? [],
    geographies: prefs?.geographies ?? [],
    thesis: null,
    focus: null,
  };

  // Try company profile first since it has clerk_user_id directly
  const { data: company } = await supabase
    .from('companies')
    .select('industry_tags, target_geographies, description, business_model')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (company) {
    if (company.industry_tags?.length) {
      ctx.sectors = [...new Set([...ctx.sectors, ...company.industry_tags])];
    }
    if (company.target_geographies?.length) {
      ctx.geographies = [...new Set([...ctx.geographies, ...company.target_geographies])];
    }
    if (company.description) ctx.thesis = company.description;
  }

  // Expert profiles also contribute (expertise areas, bio)
  const { data: expert } = await supabase
    .from('experts')
    .select('expertise_areas, bio')
    .eq('clerk_user_id', clerkUserId)
    .maybeSingle();

  if (expert) {
    if (expert.expertise_areas?.length) {
      ctx.sectors = [...new Set([...ctx.sectors, ...expert.expertise_areas])];
    }
    if (expert.bio && !ctx.thesis) ctx.thesis = expert.bio;
  }

  // Investors don't have a clerk_user_id on their profile tables — their
  // sectors/geographies live on user_news_preferences only, which we
  // already loaded. Nothing extra to join.

  return ctx;
}

/**
 * Refresh the embedding for one user. Returns:
 *   { updated: true, text_length: N }       — success
 *   { updated: false, reason: 'no_prefs' }  — user has nothing to embed yet
 *   { updated: false, reason: 'error', message } — failed
 */
export async function refreshUserEmbedding(supabase, clerkUserId) {
  try {
    const ctx = await loadUserContext(supabase, clerkUserId);
    const text = buildUserEmbeddingText(ctx);

    if (!text) {
      return { updated: false, reason: 'no_prefs' };
    }

    const vector = await embedText(text);
    if (!vector) {
      return { updated: false, reason: 'embed_returned_null' };
    }

    // Upsert into user_news_preferences — this creates the row if the user
    // doesn't have a prefs row yet (so ranking still works for users who
    // have saved profile data in companies/experts but no explicit prefs).
    const { error } = await supabase
      .from('user_news_preferences')
      .upsert(
        {
          clerk_user_id: clerkUserId,
          user_embedding: vector,
          embedding_updated_at: new Date().toISOString(),
          sectors: ctx.sectors,
          geographies: ctx.geographies,
        },
        { onConflict: 'clerk_user_id' }
      );

    if (error) {
      return { updated: false, reason: 'error', message: error.message };
    }

    return { updated: true, text_length: text.length };
  } catch (err) {
    return { updated: false, reason: 'error', message: err.message };
  }
}

/**
 * Refresh embeddings for all users who need it. A user needs refresh if:
 *   - They have preferences/profile data AND
 *   - Their embedding_updated_at is null OR older than `max_age_hours`
 *
 * This is called by the daily cron.
 */
export async function refreshAllUserEmbeddings(supabase, { maxAgeHours = 24 } = {}) {
  const stats = { attempted: 0, updated: 0, skipped: 0, failed: 0, errors: [] };

  // Gather candidate clerk_user_ids from all profile tables. Deduplicate.
  const candidates = new Set();

  const { data: prefsUsers } = await supabase
    .from('user_news_preferences')
    .select('clerk_user_id, embedding_updated_at');
  for (const p of prefsUsers ?? []) {
    if (!p.embedding_updated_at) {
      candidates.add(p.clerk_user_id);
      continue;
    }
    const ageHours = (Date.now() - new Date(p.embedding_updated_at).getTime()) / 3_600_000;
    if (ageHours >= maxAgeHours) candidates.add(p.clerk_user_id);
  }

  const { data: companyUsers } = await supabase
    .from('companies')
    .select('clerk_user_id')
    .not('clerk_user_id', 'is', null);
  for (const c of companyUsers ?? []) candidates.add(c.clerk_user_id);

  const { data: expertUsers } = await supabase
    .from('experts')
    .select('clerk_user_id')
    .not('clerk_user_id', 'is', null);
  for (const e of expertUsers ?? []) candidates.add(e.clerk_user_id);

  for (const clerkUserId of candidates) {
    stats.attempted += 1;
    const result = await refreshUserEmbedding(supabase, clerkUserId);
    if (result.updated) stats.updated += 1;
    else if (result.reason === 'no_prefs') stats.skipped += 1;
    else {
      stats.failed += 1;
      stats.errors.push({ clerk_user_id: clerkUserId, message: result.message });
    }
  }

  return stats;
}
