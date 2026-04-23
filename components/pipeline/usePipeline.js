/**
 * components/pipeline/usePipeline.js
 *
 * React hook that manages pipeline state. Handles the one-time
 * localStorage migration on first mount, then keeps a local cache of the
 * user's saved companies so save/unsave operations feel instant.
 *
 * Usage:
 *
 *   const { pipeline, isSaved, save, unsave, setStage, loading } = usePipeline();
 *
 *   if (isSaved(companyId)) { ... }
 *   await save(companyId, 'watching');
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  fetchPipeline,
  savePipelineEntry,
  updatePipelineEntry,
  removePipelineEntry,
  migrateIfNeeded,
} from '@/lib/pipeline/client';

export function usePipeline() {
  const [pipeline, setPipeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Index by company_id for O(1) isSaved() lookups
  const savedIds = new Set(pipeline.map((e) => e.company?.id ?? e.company_id));

  const refresh = useCallback(async () => {
    try {
      const data = await fetchPipeline();
      setPipeline(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Migrate any localStorage data on first mount
        await migrateIfNeeded();
        if (cancelled) return;
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refresh]);

  const isSaved = useCallback(
    (companyId) => savedIds.has(Number(companyId)),
    [savedIds]
  );

  const save = useCallback(async (companyId, stage = 'watching', notes = null) => {
    // Optimistic update: add to local state immediately, then reconcile
    const optimistic = {
      company: { id: Number(companyId) },
      stage,
      notes,
      saved_at: new Date().toISOString(),
    };
    setPipeline((prev) => [optimistic, ...prev.filter((e) => (e.company?.id ?? e.company_id) !== Number(companyId))]);

    try {
      await savePipelineEntry({ company_id: Number(companyId), stage, notes });
      await refresh();
    } catch (err) {
      // Rollback on failure
      await refresh();
      throw err;
    }
  }, [refresh]);

  const unsave = useCallback(async (companyId) => {
    setPipeline((prev) => prev.filter((e) => (e.company?.id ?? e.company_id) !== Number(companyId)));
    try {
      await removePipelineEntry(Number(companyId));
    } catch (err) {
      await refresh();
      throw err;
    }
  }, [refresh]);

  const setStage = useCallback(async (companyId, stage) => {
    setPipeline((prev) =>
      prev.map((e) =>
        (e.company?.id ?? e.company_id) === Number(companyId)
          ? { ...e, stage }
          : e
      )
    );
    try {
      await updatePipelineEntry({ company_id: Number(companyId), stage });
    } catch (err) {
      await refresh();
      throw err;
    }
  }, [refresh]);

  return {
    pipeline,
    loading,
    error,
    isSaved,
    save,
    unsave,
    setStage,
    refresh,
  };
}
