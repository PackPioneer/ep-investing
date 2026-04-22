/**
 * app/news/page.jsx
 *
 * Public-facing news page.
 *
 *   Unauthenticated:  3 teaser headlines + login/signup CTA
 *   Authenticated:    Full chronological feed with source + region filters
 *
 * Phase 1 is intentionally minimal UI. Personalization ("For You" tab in the
 * dashboards) arrives in Phase 3 and has a distinct entry point.
 */

import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { hasNewsAccess, UNAUTH_TEASER_COUNT } from '@/lib/news/access';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PAGE_SIZE = 25;

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  );
}

async function loadArticles({ limit, offset, sourceSlug, region }) {
  const supabase = getSupabase();

  let query = supabase
    .from('news_articles')
    .select(`
      id, title, url, excerpt, summary_factual, published_at, image_url,
      is_secondary_source, primary_source_attribution,
      source:news_sources ( id, slug, name, homepage_url, attribution_label, region, credibility_tier )
    `)
    .order('published_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1);

  if (sourceSlug) {
    const { data: src } = await supabase
      .from('news_sources')
      .select('id')
      .eq('slug', sourceSlug)
      .single();
    if (src?.id) query = query.eq('source_id', src.id);
  }

  if (region) {
    const { data: srcIds } = await supabase
      .from('news_sources')
      .select('id')
      .eq('region', region);
    const ids = (srcIds ?? []).map((r) => r.id);
    if (ids.length > 0) query = query.in('source_id', ids);
  }

  const { data, error } = await query;
  if (error) {
    console.error('loadArticles error:', error);
    return [];
  }
  return data ?? [];
}

async function loadSources() {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('news_sources')
    .select('slug, name, region')
    .eq('active', true)
    .order('name');
  return data ?? [];
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffHours = (now - d) / (1000 * 60 * 60);
  if (diffHours < 24) {
    const h = Math.max(1, Math.round(diffHours));
    return `${h}h ago`;
  }
  if (diffHours < 24 * 7) {
    const days = Math.round(diffHours / 24);
    return `${days}d ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ArticleCard({ article }) {
  const source = article.source;
  return (
    <article className="border-b border-neutral-200 py-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-neutral-500 mb-1.5">
            {source?.homepage_url ? (
              <Link href={source.homepage_url} className="font-medium hover:text-neutral-900" target="_blank" rel="noopener">
                {source?.name}
              </Link>
            ) : (
              <span className="font-medium">{source?.name}</span>
            )}
            {source?.attribution_label && (
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {source.attribution_label}
              </span>
            )}
            {article.is_secondary_source && !source?.attribution_label && (
              <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-600">
                secondary source
              </span>
            )}
            <span>·</span>
            <time dateTime={article.published_at}>{formatDate(article.published_at)}</time>
          </div>

          <h2 className="text-lg font-semibold leading-snug">
            <Link href={article.url} target="_blank" rel="noopener" className="hover:text-emerald-700">
              {article.title}
            </Link>
          </h2>

          {(article.summary_factual || article.excerpt) && (
            <p className="mt-1.5 text-sm text-neutral-600 line-clamp-3">
              {article.summary_factual || article.excerpt}
            </p>
          )}
        </div>

        {article.image_url && (
          <img
            src={article.image_url}
            alt=""
            className="h-20 w-28 flex-shrink-0 rounded object-cover"
          />
        )}
      </div>
    </article>
  );
}

function Paywall() {
  return (
    <div className="mt-6 rounded-lg border border-emerald-200 bg-emerald-50/40 p-6 text-center">
      <h3 className="text-lg font-semibold text-neutral-900">
        Sign in to read the full climate intelligence feed
      </h3>
      <p className="mt-2 text-sm text-neutral-600">
        EP Investing members get the full feed, policy tracker, and personalized
        dashboards. Free through July 15, 2026.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          href="/sign-up"
          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Create a free account
        </Link>
        <Link
          href="/sign-in"
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default async function NewsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page ?? '1', 10) || 1);
  const sourceSlug = params?.source || null;
  const region = params?.region || null;

  const { userId } = await auth();
  const authed = Boolean(userId);

  // Minimal user object for the access check. When subscription fields are
  // available in the DB (post-Stripe webhook), fetch them here.
  const user = authed ? { clerk_user_id: userId } : null;
  const fullAccess = hasNewsAccess(user);

  const limit = fullAccess ? PAGE_SIZE : UNAUTH_TEASER_COUNT;
  const offset = fullAccess ? (page - 1) * PAGE_SIZE : 0;

  const [articles, sources] = await Promise.all([
    loadArticles({ limit, offset, sourceSlug, region }),
    loadSources(),
  ]);

  const regions = [...new Set(sources.map((s) => s.region).filter(Boolean))].sort();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          Climate intelligence feed
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Curated reporting on climate tech, clean energy, and policy from trusted sources worldwide.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        {/* Filter sidebar — only for authenticated users with full access */}
        {fullAccess && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Region
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  <FilterPill href="/news" active={!region && !sourceSlug} label="All" />
                  {regions.map((r) => (
                    <FilterPill
                      key={r}
                      href={`/news?region=${r}`}
                      active={region === r}
                      label={r.toUpperCase()}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                  Source
                </h3>
                <ul className="space-y-1 text-sm">
                  {sources.map((s) => (
                    <li key={s.slug}>
                      <Link
                        href={`/news?source=${s.slug}`}
                        className={`block rounded px-2 py-1 hover:bg-neutral-100 ${
                          sourceSlug === s.slug
                            ? 'bg-emerald-50 text-emerald-800 font-medium'
                            : 'text-neutral-700'
                        }`}
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </aside>
        )}

        <main>
          {articles.length === 0 ? (
            <p className="text-neutral-500 text-sm py-12">
              No articles yet. Ingestion may still be running — check back shortly.
            </p>
          ) : (
            <div>
              {articles.map((a) => (
                <ArticleCard key={a.id} article={a} />
              ))}
            </div>
          )}

          {!fullAccess && <Paywall />}

          {fullAccess && articles.length === PAGE_SIZE && (
            <div className="mt-6 flex justify-between text-sm">
              {page > 1 ? (
                <Link
                  href={buildHref({ page: page - 1, source: sourceSlug, region })}
                  className="text-neutral-600 hover:text-neutral-900"
                >
                  ← Newer
                </Link>
              ) : (
                <span />
              )}
              <Link
                href={buildHref({ page: page + 1, source: sourceSlug, region })}
                className="text-neutral-600 hover:text-neutral-900"
              >
                Older →
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function FilterPill({ href, active, label }) {
  return (
    <Link
      href={href}
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
        active
          ? 'bg-emerald-600 text-white'
          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref({ page, source, region }) {
  const params = new URLSearchParams();
  if (page && page > 1) params.set('page', String(page));
  if (source) params.set('source', source);
  if (region) params.set('region', region);
  const qs = params.toString();
  return qs ? `/news?${qs}` : '/news';
}
