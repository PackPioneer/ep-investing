/**
 * lib/pipeline/client.js
 *
 * Client-side API for reading/writing pipeline data. Drop-in replacement
 * for the Phase 1 localStorage implementation.
 *
 * Includes a one-time migration that runs on first load after Phase 3A
 * deploys: detects existing localStorage pipeline data, pushes it to
 * Supabase, then clears localStorage so it can't drift out of sync.
 *
 * Usage from a React component:
 *
 *   import { fetchPipeline, savePipelineEntry, removePipelineEntry, migrateIfNeeded } from '@/lib/pipeline/client';
 *
 *   useEffect(() => {
 *     migrateIfNeeded().then(() => fetchPipeline()).then(setPipeline);
 *   }, []);
 */

// LocalStorage keys the Phase 1 code wrote to. The investor dashboard uses
// TWO keys in parallel: ep_saved (array of company IDs) and ep_pipeline
// (map of id → stage). We migrate both in readLegacyLocalStorage.
const LEGACY_SAVED_KEY = 'ep_saved';
const LEGACY_PIPELINE_KEY = 'ep_pipeline';

// Extra key names checked as a fallback for any variant installations.
const LEGACY_FALLBACK_KEYS = [
  'investor_pipeline',
  'saved_companies',
  'pipeline_v1',
];

// Flag we set in localStorage after a successful migration so we don't
// re-run it on every page load.
const MIGRATION_FLAG = 'ep_pipeline_migrated_v1';

/**
 * Fetch all saved companies for the current user. Returns array of:
 *   { id, stage, notes, saved_at, updated_at, company: { id, name, logo_url, ... } }
 */
export async function fetchPipeline() {
  const res = await fetch('/api/pipeline', { cache: 'no-store' });
  if (!res.ok) {
    throw new Error(`Fetch pipeline failed: ${res.status}`);
  }
  const json = await res.json();
  return json.saved ?? [];
}

/**
 * Save or update a pipeline entry. If the company is already saved, this
 * updates its stage/notes. Returns the saved row.
 */
export async function savePipelineEntry({ company_id, stage, notes }) {
  const res = await fetch('/api/pipeline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, stage, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Save failed: ${res.status}`);
  }
  const json = await res.json();
  return json.saved;
}

/**
 * Update just the stage or notes on an existing entry.
 */
export async function updatePipelineEntry({ company_id, stage, notes }) {
  const res = await fetch('/api/pipeline', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_id, stage, notes }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Update failed: ${res.status}`);
  }
  const json = await res.json();
  return json.saved;
}

/**
 * Remove a company from the user's pipeline.
 */
export async function removePipelineEntry(company_id) {
  const res = await fetch(`/api/pipeline?company_id=${company_id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Remove failed: ${res.status}`);
  }
  return true;
}

/**
 * Read any pipeline data from localStorage. The Phase 1 investor dashboard
 * stores saved companies in two separate keys:
 *   - 'ep_saved': JSON array of company IDs, e.g. [1, 5, 23]
 *   - 'ep_pipeline': JSON map of id → stage, e.g. { "1": "contacted", "5": "watching" }
 *
 * We merge both: a company is saved if it appears in ep_saved OR ep_pipeline,
 * and its stage comes from ep_pipeline or defaults to 'watching'.
 *
 * Returns an array of normalized entries ready to POST to the API, or empty
 * if nothing is found.
 */
function readLegacyLocalStorage() {
  if (typeof window === 'undefined') return [];

  const result = new Map(); // company_id → { stage, notes }

  // Read ep_saved (array of IDs)
  try {
    const rawSaved = window.localStorage.getItem(LEGACY_SAVED_KEY);
    if (rawSaved) {
      const ids = JSON.parse(rawSaved);
      if (Array.isArray(ids)) {
        for (const id of ids) {
          const cid = Number(id);
          if (Number.isFinite(cid)) {
            result.set(cid, { stage: 'watching', notes: null });
          }
        }
      }
    }
  } catch {
    // malformed — skip
  }

  // Read ep_pipeline (map of id → stage). Overwrites stage from ep_saved
  // since ep_pipeline is the more specific signal.
  try {
    const rawPipeline = window.localStorage.getItem(LEGACY_PIPELINE_KEY);
    if (rawPipeline) {
      const map = JSON.parse(rawPipeline);
      if (map && typeof map === 'object') {
        for (const [id, stage] of Object.entries(map)) {
          const cid = Number(id);
          if (!Number.isFinite(cid)) continue;
          const normalizedStage = normalizeStage(stage);
          const existing = result.get(cid) ?? { stage: 'watching', notes: null };
          result.set(cid, { ...existing, stage: normalizedStage });
        }
      }
    }
  } catch {
    // malformed — skip
  }

  // Fallback keys from other hypothetical installations
  for (const key of LEGACY_FALLBACK_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const e of parsed) {
          const cid = Number(e?.company_id ?? e?.id);
          if (!Number.isFinite(cid) || result.has(cid)) continue;
          result.set(cid, {
            stage: normalizeStage(e?.stage),
            notes: e?.notes ?? null,
          });
        }
      }
    } catch {
      continue;
    }
  }

  return Array.from(result.entries()).map(([company_id, { stage, notes }]) => ({
    company_id,
    stage,
    notes,
  }));
}

/**
 * Normalize the stage name from localStorage. Accepts the names the Phase 1
 * dashboard uses directly ('watching', 'contacted', 'diligence', 'passed').
 */
function normalizeStage(raw) {
  if (typeof raw !== 'string') return 'watching';
  const s = raw.toLowerCase().trim();
  if (['watching', 'contacted', 'diligence', 'in_diligence', 'passed'].includes(s)) return s;
  return 'watching';
}

function clearLegacyLocalStorage() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LEGACY_SAVED_KEY);
  window.localStorage.removeItem(LEGACY_PIPELINE_KEY);
  for (const key of LEGACY_FALLBACK_KEYS) {
    window.localStorage.removeItem(key);
  }
}

/**
 * One-time migration: push any existing localStorage pipeline to the API
 * and clear localStorage afterward. Safe to call on every page load —
 * short-circuits after the first successful run.
 *
 * Returns { migrated: number, skipped: boolean }.
 */
export async function migrateIfNeeded() {
  if (typeof window === 'undefined') return { migrated: 0, skipped: true };

  // Already migrated? Skip.
  if (window.localStorage.getItem(MIGRATION_FLAG)) {
    return { migrated: 0, skipped: true };
  }

  const entries = readLegacyLocalStorage();
  if (entries.length === 0) {
    // Nothing to migrate. Mark as done so we don't keep reading localStorage.
    window.localStorage.setItem(MIGRATION_FLAG, '1');
    return { migrated: 0, skipped: true };
  }

  let migrated = 0;
  const errors = [];

  // Post entries sequentially to keep load light and make errors easier to
  // track. 20 entries × ~100ms = 2s, totally fine for a one-time migration.
  for (const entry of entries) {
    try {
      await savePipelineEntry(entry);
      migrated += 1;
    } catch (err) {
      errors.push({ company_id: entry.company_id, message: err.message });
    }
  }

  // Only clear localStorage + set the flag if EVERYTHING migrated. If some
  // entries failed (e.g., company got deleted), leave localStorage intact
  // so the user can retry or we can debug. Better to have a stale dupe
  // than silently lose their pipeline.
  if (errors.length === 0) {
    clearLegacyLocalStorage();
    window.localStorage.setItem(MIGRATION_FLAG, '1');
  } else {
    console.warn('Pipeline migration had errors:', errors);
  }

  return { migrated, errors, skipped: false };
}
