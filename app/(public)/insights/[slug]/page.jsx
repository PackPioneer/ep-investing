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
          <div className="text-[9px] font-mono text-[#4a5568]">
            ${d.value}B
          </div>
          <div
            className="w-full rounded-t-sm bg-[#2d6a4f] transition-all"
            style={{ height: `${(d.value / max) * 80}px`, opacity: 0.7 + (i / data.length) * 0.3 }}
          />
          <div className="text-[9px] font-mono text-[#718096]">{d.label}</div>
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
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!report || report.message) return (
    <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center text-[#4a5568]">
      Report not found.
    </div>
  );

  const keyFindings = report.key_findings || [];
  const chartData = report.chart_data || [];

  return (
    <div className="min-h-screen bg-[#f2f4f8] text-[#0f1a14]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Back */}
        <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-10">
          <ArrowLeft size={14} /> Back to reports
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 flex flex-col gap-7">

            {/* Hero */}
            <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-8">
              <div className="flex flex-wrap gap-2 mb-5">
                {report.sector && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
                    {report.sector.replace(/_/g, " ")}
                  </span>
                )}
                {report.geography && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-[#ffffff] text-[#4a5568] flex items-center gap-1">
                    <Globe size={8} /> {report.geography}
                  </span>
                )}
                {report.published_at && (
                  <span className="text-[10px] font-mono text-[#718096]">
                    Published {new Date(report.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] leading-tight mb-2">
                {report.title}
              </h1>
              {report.subtitle && (
                <p className="text-[#4a5568] text-base font-light mb-6">{report.subtitle}</p>
              )}

              {/* Market stats */}
              {(report.market_value || report.expected_growth) && (
                <div className="flex gap-6 p-4 bg-[#f2f4f8] rounded-xl border border-[#e2e6ed] mb-6">
                  {report.market_value && (
                    <div>
                      <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1">Market Size</div>
                      <div style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#2d6a4f]">{report.market_value}</div>
                    </div>
                  )}
                  {report.expected_growth && (
                    <div className="border-l border-[#e2e6ed] pl-6">
                      <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1">Expected Growth</div>
                      <div style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14]">{report.expected_growth}</div>
                    </div>
                  )}
                </div>
              )}

              <p className="text-sm text-[#4a5568] leading-relaxed font-light">{report.summary}</p>
            </div>

            {/* Funding chart */}
            {chartData.length > 0 && (
              <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp size={16} className="text-[#2d6a4f]" />
                  <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investment Flow ($B)</h2>
                </div>
                <SimpleBarChart data={chartData} />
              </div>
            )}

            {/* Key findings */}
            {keyFindings.length > 0 && (
              <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-7">
                <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-6">Key Findings</h2>
                <div className="flex flex-col gap-5">
                  {keyFindings.map((finding, i) => (
                    <div key={i} className="flex gap-4 pb-5 border-b border-[#e2e6ed] last:border-0 last:pb-0">
                      <div className="w-6 h-6 rounded-full bg-[#eef1f6] border border-[#c8d8cc] flex items-center justify-center text-[10px] font-mono text-[#2d6a4f] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#0f1a14] mb-1">{finding.heading}</div>
                        <div className="text-sm text-[#4a5568] leading-relaxed font-light">{finding.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PDF download or locked */}
            {report.pdf_url ? (
              <a href={report.pdf_url} target="_blank" rel="noopener noreferrer"
                className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-6 flex items-center justify-between hover:border-[#2d6a4f] transition-all group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[rgba(45,106,79,0.08)] border border-[#c8d8cc] flex items-center justify-center">
                    <Download size={16} className="text-[#2d6a4f]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#0f1a14]">Download full report (PDF)</div>
                    <div className="text-xs text-[#4a5568] font-mono">Free with EP Investment account</div>
                  </div>
                </div>
                <ExternalLink size={14} className="text-[#718096] group-hover:text-[#2d6a4f] transition-colors" />
              </a>
            ) : (
              <div className="bg-[#ffffff] border border-[#d0d6e0] rounded-2xl p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#e2e6ed] flex items-center justify-center">
                    <Lock size={16} className="text-[#718096]" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#718096]">Full PDF report</div>
                    <div className="text-xs text-[#718096] font-mono">Available with Investor Pro ($129/mo)</div>
                  </div>
                </div>
                <Link href="/get-matched"
                  className="text-xs font-semibold bg-[#2d6a4f] text-[#f2f4f8] px-4 py-2 rounded-lg hover:bg-[#235a40] transition-all">
                  Upgrade
                </Link>
              </div>
            )}

            {/* Linked companies */}
            {companies.length > 0 && (
              <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Building2 size={15} className="text-[#2d6a4f]" />
                    <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">
                      Companies in this sector
                    </h2>
                  </div>
                  <Link href={`/search?q=${report.sector}`} className="text-xs text-[#2d6a4f] font-mono hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {companies.map(co => (
                    <Link key={co.id} href={`/companies/${co.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#f2f4f8] border border-[#e2e6ed] hover:border-[#2d6a4f] transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-[#e2e6ed] flex items-center justify-center text-xs font-bold text-[#2d6a4f] flex-shrink-0">
                        {(co.name || co.url || "?")[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#0f1a14] truncate group-hover:text-[#2d6a4f] transition-colors">
                          {co.name || co.url}
                        </div>
                        {co.production_status && (
                          <div className="text-[10px] text-[#718096] font-mono">{co.production_status}</div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Linked investors */}
            {investors.length > 0 && (
              <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-7">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <Wallet size={15} className="text-[#2d6a4f]" />
                    <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">
                      Active investors in this sector
                    </h2>
                  </div>
                  <Link href="/investors" className="text-xs text-[#2d6a4f] font-mono hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="flex flex-col gap-2">
                  {investors.map(inv => (
                    <Link key={inv.id} href={`/investors/${inv.id}`}
                      className="flex items-center gap-3 p-3 rounded-lg bg-[#f2f4f8] border border-[#e2e6ed] hover:border-[#2d6a4f] transition-all group">
                      <div className="w-8 h-8 rounded-lg bg-[#e2e6ed] flex items-center justify-center text-xs font-bold text-[#2d6a4f] flex-shrink-0">
                        {(inv.name || "?")[0].toUpperCase()}
                      </div>
                      <span className="text-xs font-medium text-[#0f1a14] group-hover:text-[#2d6a4f] transition-colors">
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
            <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-5">Report Details</h3>
              <div className="flex flex-col gap-4 text-sm">
                {report.sector && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1">Sector</div>
                    <div className="text-[#0f1a14] capitalize">{report.sector.replace(/_/g, " ")}</div>
                  </div>
                )}
                {report.geography && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1">Geography</div>
                    <div className="text-[#0f1a14]">{report.geography}</div>
                  </div>
                )}
                {report.published_at && (
                  <div>
                    <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1">Published</div>
                    <div className="text-[#0f1a14]">{new Date(report.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Relevant grants */}
            {grants.length > 0 && (
              <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={14} className="text-[#2d6a4f]" />
                  <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase">Related Grants</h3>
                </div>
                {grants.map(grant => (
                  <Link key={grant.id} href={`/grants/${grant.id}`}
                    className="flex items-start justify-between py-3 border-b border-[#e2e6ed] last:border-0 hover:opacity-80 transition-opacity group">
                    <span className="text-xs text-[#4a5568] group-hover:text-[#0f1a14] transition-colors pr-2">
                      {grant.title || grant.name}
                    </span>
                    {grant.deadline_date && (
                      <span className="text-[10px] font-mono text-[#ff9650] flex-shrink-0">
                        {new Date(grant.deadline_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    )}
                  </Link>
                ))}
                <Link href="/grants" className="mt-3 text-xs text-[#2d6a4f] font-mono hover:underline flex items-center gap-1">
                  All grants →
                </Link>
              </div>
            )}

            {/* CTA — get matched */}
            <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-6">
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-[#0f1a14] mb-2">
                Investing in this sector?
              </h3>
              <p className="text-xs text-[#4a5568] leading-relaxed mb-4 font-light">
                Get matched to vetted companies and co-investors aligned to your thesis.
              </p>
              <Link href="/get-matched"
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-[#f2f4f8] font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                Get matched
              </Link>
            </div>

            {/* Browse more reports */}
            <div className="bg-[#ffffff] border border-[#e2e6ed] rounded-2xl p-6">
              <h3 className="text-xs font-mono font-semibold text-[#4a5568] tracking-widest uppercase mb-4">More reports</h3>
              <Link href="/insights" className="text-xs text-[#2d6a4f] font-mono hover:underline flex items-center gap-1">
                Browse all industry reports →
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
