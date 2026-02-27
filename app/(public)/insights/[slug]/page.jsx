"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Globe, TrendingUp, Building2, Wallet, FileText, ExternalLink, Lock } from "lucide-react";

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="text-[9px] font-mono text-[#6b7a72]">
            ${d.value}B
          </div>
          <div
            className="w-full rounded-t-sm bg-[#c8f560] transition-all"
            style={{ height: `${(d.value / max) * 80}px`, opacity: 0.7 + (i / data.length) * 0.3 }}
          />
          <div className="text-[9px] font-mono text-[#4a5550]">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function ReportPage() {
  const { slug } = useParams();
  const [report, setReport] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [investors, setInvestors] = useState([]);
  const [grants, setGrants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/reports?slug=${slug}`)
      .then(r => r.json())
      .then(async (data) => {
        setReport(data);

        // Fetch linked companies via industry tag
        if (data.linked_company_tags?.length > 0) {
          const tag = data.linked_company_tags[0];
          const res = await fetch(`/api/search?q=${tag}`);
          const results = await res.json();
          setCompanies((results.companies || []).slice(0, 6));
          setInvestors((results.investors || []).slice(0, 4));
          setGrants((results.grants || []).slice(0, 3));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen bg-[#0a0d0f] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#c8f560] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report || report.message) return (
    <div className="min-h-screen bg-[#0a0d0f] flex items-center justify-center text-[#6b7a72]">
      Report not found.
    </div>
  );

  const keyFindings = report.key_findings || [];
  const chartData = report.chart_data || [];

  return (
    <div className="min-h-screen bg-[#0a0d0f] text-[#e8ede8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-[#6b7a72] hover:text-[#e8ede8] transition-colors mb-10">
          <ArrowLeft size={14} /> Back to reports
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 flex flex-col gap-7">

            {/* Hero */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-8">
              <div className="flex flex-wrap gap-2 mb-5">
                {report.sector && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2e24] bg-[#151d18] text-[#c8f560]">
                    {report.sector.replace(/_/g, " ")}
                  </span>
                )}
                {report.geography && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#1e2428] bg-[#111518] text-[#6b7a72] flex items-center gap-1">
                    <Globe size={8} /> {report.geography}
                  </span>
                )}
                {report.published_at && (
                  <span className="text-[10px] font-mono text-[#4a5550]">
                    Published {new Date(report.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#e8ede8] leading-tight mb-2">
                {report.title}
              </h1>
              {report.subtitle && (
                <p className="text-[#6b7a72] text-base font-light mb-6">{report.subtitle}</p>
              )}

              {/* Market stats */}
              {(report.market_value || report.expected_growth) && (
                <div className="flex gap-6 p-4 bg-[#0a0d0f] rounded-xl border border-[#1e2428] mb-6">
                  {report.market_value && (
                    <div>
                      <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-1">Market Size</div>
                      <div style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#c8f560]">{report.market_value}</div>
                    </div>
                  )}
                  {report.expected_growth && (
                    <div className="border-l border-[#1e2428] pl-6">
                      <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-1">Expected Growth</div>
                      <div style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#e8ede8]">{report.expected_growth}</div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-[#6b7a72] leading-relaxed font-light">{report.summary}</p>
            </div>

            {/* Funding chart */}
            {chartData.length > 0 && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-[#c8f560]" />
                  <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">Investment Flow ($B)</h2>
                </div>
                <SimpleBarChart data={chartData} />
              </div>
            )}

            {/* Key findings */}
            {keyFindings.length > 0 && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase mb-6">Key Findings</h2>
                <div className="flex flex-col gap-5">
                  {keyFindings.map((finding, i) => (
                    <div key={i} className="flex gap-4 pb-5 border-b border-[#1e2428] last:border-0 last:pb-0">
                      <div className="w-6 h-6 rounded-full bg-[#151d18] border border-[#1e2e24] flex items-center justify-center text-[10px] font-mono text-[#c8f560] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#e8ede8] mb-1">{finding.heading}</div>
                        <div className="text-sm text-[#6b7a72] leading-relaxed font-light">{finding.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF download or locked */}
            {report.pdf_url ? (
              <a href={report.pdf_url} target="_blank" rel="noopener noreferrer"
                className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6 flex items-center justify-between hover:border-[#c8f560] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(200,245,96,0.1)] border border-[#1e2e24] flex items-center justify-center">
                    <Download size={16} className="text-[#c8f560]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#e8ede8]">Download full report (PDF)</div>
                    <div className="text-xs text-[#6b7a72] font-mono">Free with EP Investment account</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#4a5550] group-hover:text-[#c8f560] transition-colors" />
              </a>
            ) : (
              <div className="bg-[#111518] border border-[#252c32] rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#1e2428] flex items-center justify-center">
                    <Lock size={16} className="text-[#4a5550]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#4a5550]">Full PDF report</div>
                    <div className="text-xs text-[#4a5550] font-mono">Available with Investor Pro ($129/mo)</div>
                  </div>
                </div>
                <Link href="/get-matched"
                  className="text-xs font-semibold bg-[#c8f560] text-[#0a0d0f] px-4 py-2 rounded-lg hover:bg-[#d4ff6b] transition-all">
                  Upgrade
                </Link>
              </div>
            )}

            {/* Linked companies */}
            {companies.length > 0 && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-[#c8f560]" />
                    <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">
                      Companies in this sector
                    </h2>
                  </div>
                  <Link href={`/search?q=${report.sector}`} className="text-xs text-[#c8f560] font-mono hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {companies.map(co => (
                    <Link key={co.id} href={`/companies/${co.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0d0f] border border-[#1e2428] hover:border-[#c8f560] transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-[#1e2428] flex items-center justify-center text-xs font-bold text-[#c8f560] flex-shrink-0">
                        {(co.name || co.url || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#e8ede8] truncate group-hover:text-[#c8f560] transition-colors">
                          {co.name || co.url}
                        </div>
                        {co.production_status && (
                          <div className="text-[10px] text-[#4a5550] font-mono">{co.production_status}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Linked investors */}
            {investors.length > 0 && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-[#c8f560]" />
                    <h2 className="text-xs font-mono font-semibold text-[#e8ede8] tracking-wide uppercase">
                      Active investors in this sector
                    </h2>
                  </div>
                  <Link href="/investors" className="text-xs text-[#c8f560] font-mono hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {investors.map(inv => (
                    <Link key={inv.id} href={`/investors/${inv.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#0a0d0f] border border-[#1e2428] hover:border-[#c8f560] transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-[#1e2428] flex items-center justify-center text-xs font-bold text-[#c8f560] flex-shrink-0">
                        {(inv.name || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-[#e8ede8] group-hover:text-[#c8f560] transition-colors">
                        {inv.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-5">

            {/* Report meta */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#6b7a72] tracking-widest uppercase mb-5">Report Details</h3>
              <div className="flex flex-col gap-4 text-sm">
                {report.sector && (
                  <div>
                    <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-1">Sector</div>
                    <div className="text-[#e8ede8] capitalize">{report.sector.replace(/_/g, " ")}</div>
                  </div>
                )}
                {report.geography && (
                  <div>
                    <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-1">Geography</div>
                    <div className="text-[#e8ede8]">{report.geography}</div>
                  </div>
                )}
                {report.published_at && (
                  <div>
                    <div className="text-[10px] font-mono text-[#4a5550] uppercase tracking-wider mb-1">Published</div>
                    <div className="text-[#e8ede8]">{new Date(report.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Relevant grants */}
            {grants.length > 0 && (
              <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-[#c8f560]" />
                  <h3 className="text-xs font-mono font-semibold text-[#6b7a72] tracking-widest uppercase">Related Grants</h3>
                </div>
                {grants.map(grant => (
                  <Link key={grant.id} href={`/grants/${grant.id}`}
                    className="flex items-start justify-between py-3 border-b border-[#1e2428] last:border-0 hover:opacity-80 transition-opacity group">
                    <span className="text-xs text-[#6b7a72] group-hover:text-[#e8ede8] transition-colors pr-2">
                      {grant.title || grant.name}
                    </span>
                    {grant.deadline_date && (
                      <span className="text-[10px] font-mono text-[#ff9650] flex-shrink-0">
                        {new Date(grant.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </Link>
                ))}
                <Link href="/grants" className="mt-3 text-xs text-[#c8f560] font-mono hover:underline flex items-center gap-1">
                  All grants →
                </Link>
              </div>
            )}

            {/* CTA — get matched */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#e8ede8] mb-2">
                Investing in this sector?
              </h3>
              <p className="text-xs text-[#6b7a72] leading-relaxed mb-4 font-light">
                Get matched to vetted companies and co-investors aligned to your thesis.
              </p>
              <Link href="/get-matched"
                className="w-full flex items-center justify-center gap-2 bg-[#c8f560] text-[#0a0d0f] font-semibold text-sm rounded-lg py-2.5 hover:bg-[#d4ff6b] transition-colors">
                Get matched
              </Link>
            </div>

            {/* Browse more reports */}
            <div className="bg-[#111518] border border-[#1e2428] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#6b7a72] tracking-widest uppercase mb-4">More reports</h3>
              <Link href="/insights" className="text-xs text-[#c8f560] font-mono hover:underline flex items-center gap-1">
                Browse all industry reports →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
