"use client";
/**
 * app/news/page.jsx (Phase 3C)
 *
 * Major change: page is now a client component that fetches from our
 * API routes instead of querying Supabase directly. This lets us switch
 * between "Latest" (chronological) and "For You" (personalized) sort
 * without reloading.
 *
 *   /news                           → Latest sort
 *   /news?sort=for-you              → For You sort (authenticated only)
 *   /news?classification=funding    → Latest, filtered to funding
 *   /news?region=us                 → Latest, US regions only
 */

import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ArticleCard from "@/components/news/ArticleCard";

const CLASSIFICATIONS = [
  { key: null, label: "All" },
  { key: "funding", label: "Funding" },
  { key: "policy", label: "Policy" },
  { key: "regulatory", label: "Regulatory" },
  { key: "m_and_a", label: "M&A" },
  { key: "product", label: "Product" },
  { key: "market", label: "Market" },
  { key: "partnership", label: "Partnership" },
];

function Paywall() {
  return (
    <div className="mt-6 rounded-2xl border border-[#c8d8cc] bg-[#eef1f6]/50 p-6 text-center">
      <h3 className="text-base font-semibold text-[#0f1a14]">
        Sign in to read the full climate intelligence feed
      </h3>
      <p className="mt-2 text-sm text-[#4a5568]">
        EP Investing members get the full feed, filter controls, and personalized For You rankings.
      </p>
      <div className="mt-4 flex justify-center gap-3">
        <Link
          href="/sign-up"
          className="rounded-lg bg-[#2d6a4f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#235a40]"
        >
          Create a free account
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg border border-[#d0d6e0] px-4 py-2 text-sm font-medium text-[#4a5568] hover:bg-white"
        >
          Sign in
        </Link>
      </div>
    </div>
  );
}

export default function NewsPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const params = useSearchParams();

  const sortParam = params.get("sort") ?? "latest";
  const classificationParam = params.get("classification") ?? null;

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authed, setAuthed] = useState(false);
  const [hasEmbedding, setHasEmbedding] = useState(null);

  const sort = sortParam === "for-you" && isSignedIn ? "for-you" : "latest";

  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const endpoint = sort === "for-you" ? "/api/news/for-you" : "/api/news";
        const qs = new URLSearchParams({ limit: "25" });
        if (sort === "latest" && classificationParam) qs.set("classification", classificationParam);
        const res = await fetch(`${endpoint}?${qs.toString()}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        setArticles(data.articles ?? []);
        setAuthed(data.authed ?? isSignedIn ?? false);
        setHasEmbedding(data.has_embedding ?? null);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, sort, classificationParam]);

  function setSort(nextSort) {
    const next = new URLSearchParams(params.toString());
    if (nextSort === "for-you") next.set("sort", "for-you");
    else next.delete("sort");
    // Clear classification when switching to For You (ranking handles relevance)
    if (nextSort === "for-you") next.delete("classification");
    router.push(`/news${next.toString() ? `?${next.toString()}` : ""}`);
  }

  function setClassification(c) {
    const next = new URLSearchParams(params.toString());
    if (c) next.set("classification", c);
    else next.delete("classification");
    router.push(`/news${next.toString() ? `?${next.toString()}` : ""}`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <header className="mb-6">
        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">
          Climate intelligence feed
        </h1>
        <p className="mt-1 text-sm text-[#718096]">
          Curated reporting on climate tech, clean energy, and policy from trusted sources worldwide.
        </p>
      </header>

      {/* Sort toggle — only visible when authed */}
      {isSignedIn && (
        <div className="mb-4 inline-flex border border-[#d0d6e0] rounded-full p-0.5 bg-white">
          <button
            onClick={() => setSort("latest")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              sort === "latest" ? "bg-[#2d6a4f] text-white" : "text-[#4a5568] hover:text-[#0f1a14]"
            }`}
          >
            Latest
          </button>
          <button
            onClick={() => setSort("for-you")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
              sort === "for-you" ? "bg-[#2d6a4f] text-white" : "text-[#4a5568] hover:text-[#0f1a14]"
            }`}
          >
            For you
          </button>
        </div>
      )}

      {/* Classification filter chips — only on Latest sort */}
      {sort === "latest" && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {CLASSIFICATIONS.map((c) => {
            const active = (c.key ?? null) === (classificationParam ?? null);
            return (
              <button
                key={c.label}
                onClick={() => setClassification(c.key)}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  active
                    ? "bg-[#2d6a4f] text-white border-[#2d6a4f]"
                    : "bg-white text-[#4a5568] border-[#d0d6e0] hover:border-[#2d6a4f]"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      )}

      {/* For You embedding status hint */}
      {sort === "for-you" && hasEmbedding === false && (
        <div className="mb-4 text-xs text-[#718096] bg-[#f8f9fb] border border-[#e2e6ed] rounded-lg px-3 py-2">
          Add sector and geography focus to your profile to improve these rankings.
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div className="py-12 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : articles.length === 0 ? (
        <p className="text-[#718096] text-sm py-12 text-center">
          No articles match the current filters.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              article={a}
              showActions={sort === "for-you"}
            />
          ))}
        </div>
      )}

      {/* Paywall for unauthenticated users */}
      {!loading && !isSignedIn && !authed && <Paywall />}
    </div>
  );
}
