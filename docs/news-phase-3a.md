# Phase 3A — Pipeline localStorage → Supabase migration

Phase 3A moves the saved/pipeline data out of each user's browser and into your database. On its own this is a nice-to-have (cross-device sync, analytics on pipeline stages). But it's a hard prerequisite for Phase 3B/3C — personalization ranking can't read localStorage from the server.

## Files added

```
supabase/migrations/20260422000000_pipeline_migration.sql   NEW  — user_saved_companies table
app/api/pipeline/route.js                                    NEW  — CRUD for pipeline
lib/pipeline/client.js                                       NEW  — client SDK + localStorage→DB migration
components/pipeline/usePipeline.js                           NEW  — React hook
components/pipeline/SaveButton.jsx                           NEW  — drop-in save toggle
```

## Files you'll edit (one-time integration)

Your existing dashboards currently write to localStorage. After Phase 3A deploys, they need to read/write through the new hook instead. This is the only manual edit in Phase 3A:

- **Investor Saved tab** (probably `app/dashboard/investor/saved/page.jsx` or similar) — replace inline localStorage code with `usePipeline()` hook
- **Company Saved tab** — same thing
- **Any save/star buttons on company cards** — replace with `<SaveButton companyId={...} />`

## 1. Run the migration

Copy the contents of `supabase/migrations/20260422000000_pipeline_migration.sql` into Supabase → SQL Editor → run. Creates `user_saved_companies` with unique constraint, indexes, and RLS.

Verify by going to Table Editor — `user_saved_companies` should appear in the table list.

## 2. Copy files in

```bash
unzip ~/Downloads/ep-news-phase-3a.zip -d ~/Downloads/
cp -r ~/Downloads/ep-news-phase-3a/supabase/. supabase/
cp -r ~/Downloads/ep-news-phase-3a/app/. app/
cp -r ~/Downloads/ep-news-phase-3a/lib/. lib/
cp -r ~/Downloads/ep-news-phase-3a/components/. components/
mkdir -p docs && cp -r ~/Downloads/ep-news-phase-3a/docs/. docs/
```

No files get overwritten in this phase.

## 3. Test the API (optional but recommended)

Start your dev server:

```bash
npm run dev
```

Sign in as a test user, then in a browser console on any page of your site:

```js
// Save a company
await fetch('/api/pipeline', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ company_id: 1, stage: 'watching' })
}).then(r => r.json());

// List saved
await fetch('/api/pipeline').then(r => r.json());

// Remove
await fetch('/api/pipeline?company_id=1', { method: 'DELETE' }).then(r => r.json());
```

If those all work, the API is good.

## 4. Wire up the UI

This is where you (or I, next time we pair up on this) swap out the localStorage code in your dashboards. Here's the pattern — adapt to your existing components.

**Old (Phase 1, localStorage):**

```jsx
function toggleSave(companyId) {
  const pipeline = JSON.parse(localStorage.getItem('ep_pipeline') || '{}');
  if (pipeline[companyId]) delete pipeline[companyId];
  else pipeline[companyId] = 'watching';
  localStorage.setItem('ep_pipeline', JSON.stringify(pipeline));
  setPipeline(pipeline);
}
```

**New (Phase 3A, Supabase):**

```jsx
'use client';
import { usePipeline } from '@/components/pipeline/usePipeline';

function InvestorSavedTab() {
  const { pipeline, setStage, unsave, loading } = usePipeline();

  if (loading) return <Spinner />;

  return (
    <div>
      {pipeline.map(entry => (
        <PipelineCard
          key={entry.company.id}
          company={entry.company}
          stage={entry.stage}
          onStageChange={(stage) => setStage(entry.company.id, stage)}
          onRemove={() => unsave(entry.company.id)}
        />
      ))}
    </div>
  );
}
```

For the save button on company cards:

```jsx
import SaveButton from '@/components/pipeline/SaveButton';

<div className="company-card">
  <h3>{company.name}</h3>
  <SaveButton companyId={company.id} />
</div>
```

**The migration is automatic.** First time any user with localStorage data loads a page that uses `usePipeline()`, their existing data gets pushed to Supabase and localStorage is cleared. No user action required.

## 5. Deploy

```bash
git add .
git commit -m "Phase 3A: pipeline migration to Supabase"
git push
```

Watch Vercel deploys.

## 6. Verify in production

Open epinvesting.com signed in as yourself. The first page load triggers the localStorage migration automatically — you'll see your existing pipeline show up in `user_saved_companies` in the DB.

If you have test users with existing pipeline data, confirm their data made it over too by checking `user_saved_companies` for their clerk_user_id.

## What's next (Phase 3B)

- OpenAI embeddings for articles
- User profile embeddings from sectors + geographies + saved companies
- Server-side ranking SQL function
- Embedding backfill script for the 212 existing articles

Phase 3C after that: the actual UI surfaces (dashboard "For You" tab, /news personalization toggle).
