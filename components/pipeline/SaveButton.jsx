/**
 * components/pipeline/SaveButton.jsx
 *
 * Drop-in star/save toggle. Replace any existing localStorage-based save
 * buttons on company cards with this.
 *
 * Usage:
 *   <SaveButton companyId={company.id} />
 *
 * The paywall nudge from the Phase 1 build summary ("soft nudge on
 * toggleSave") can be added here via the `onRequirePaywall` prop.
 */

'use client';

import { Star } from 'lucide-react';
import { usePipeline } from './usePipeline';

export default function SaveButton({
  companyId,
  className = '',
  onRequirePaywall,
  size = 20,
}) {
  const { isSaved, save, unsave, loading } = usePipeline();

  const saved = isSaved(companyId);

  async function handleClick(e) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    try {
      if (saved) {
        await unsave(companyId);
      } else {
        // Paywall nudge hook — preserves the existing Phase 1 behavior
        if (onRequirePaywall && !(await onRequirePaywall())) return;
        await save(companyId);
      }
    } catch (err) {
      console.error('Pipeline toggle failed:', err);
    }
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? 'Remove from pipeline' : 'Save to pipeline'}
      className={`inline-flex items-center justify-center rounded-md p-1.5 transition-colors hover:bg-neutral-100 disabled:opacity-50 ${className}`}
      disabled={loading}
    >
      <Star
        size={size}
        className={saved ? 'fill-emerald-600 text-emerald-600' : 'text-neutral-400'}
      />
    </button>
  );
}
