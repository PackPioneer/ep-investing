"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, TrendingUp, FileText } from "lucide-react";

function SimpleBarChart({ data }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value));
  return (
    <div className="flex items-end gap-2 h-28">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-1 flex-1">
          <div className="text-[9px] font-mono text-[#4a5568]">${d.value}B</div>
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/reports?slug=${slug}`)
      .then(r => r.json())
      .then(data => { setReport(data); setLoading(false); })
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

        <Link href="/insights" className="inline-flex items-center gap-1.5 text-sm text-[#4a5568] hover:text-[#0f1a14] transition-colors mb-10">
          <ArrowLeft size={14} /> Back to reports
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* MAIN CONTENT */}
          <div className="lg:col-span-2 flex flex-col gap-7">

            {/* Hero — always visible */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
              <div className="flex flex-wrap gap-2 mb-5">
                {report.sector && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#c8d8cc] bg-[#eef1f6] text-[#2d6a4f]">
                    {report.sector.replace(/_/g, " ")}
                  </span>
                )}
                {report.geography && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border border-[#e2e6ed] bg-white text-[#4a5568] flex items-center gap-1">
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

            {/* PAYWALLED CONTENT */}
            <div className="relative">

              {/* Overlay */}
              <div className="absolute inset-0 z-10 backdrop-blur-sm bg-[#f2f4f8]/80 rounded-2xl flex flex-col items-center justify-center text-center px-6 py-16">
                <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> Early Access
                </div>
                <h2 style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-3">
                  Full reports available April 15
                </h2>
                <p className="text-sm text-[#4a5568] font-light max-w-md mb-6">
                  EP Investing is now open and free through July 15, 2025.
                </p>
                <Link href="/pricing"
                  className="flex items-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg px-6 py-3 hover:bg-[#235a40] transition-colors">
                  Get started free
                </Link>
              </div>

              {/* Blurred preview */}
              <div className="pointer-events-none select-none flex flex-col gap-7">
                {chartData.length > 0 && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                    <div className="flex items-center gap-2 mb-6">
                      <TrendingUp size={16} className="text-[#2d6a4f]" />
                      <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase">Investment Flow ($B)</h2>
                    </div>
                    <SimpleBarChart data={chartData} />
                  </div>
                )}
                {keyFindings.length > 0 && (
                  <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7">
                    <h2 className="text-xs font-mono font-semibold text-[#0f1a14] tracking-wide uppercase mb-6">Key Findings</h2>
                    <div className="flex flex-col gap-5">
                      {keyFindings.slice(0, 2).map((finding, i) => (
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
                {/* Placeholder cards to add height */}
                <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 h-40" />
                <div className="bg-white border border-[#e2e6ed] rounded-2xl p-7 h-32" />
              </div>
            </div>

          </div>

          {/* SIDEBAR */}
          <div className="flex flex-col gap-5">

            {/* Report meta */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
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

            {/* Waitlist CTA */}
            <div className="bg-[#0f1a14] border border-[#2d6a4f] rounded-2xl p-6">
              <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase mb-3">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> Launching April 15
              </div>
              <h3 style={{ fontFamily: "Georgia, serif" }} className="text-lg text-white mb-2">
                Get started free
              </h3>
              <p className="text-xs text-[#a0b8a8] leading-relaxed mb-4 font-light">
                Get full access to reports, investor matching, and company signals.
              </p>
              <Link href="/pricing"
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-2.5 hover:bg-[#235a40] transition-colors">
                Get started free
              </Link>
            </div>

            {/* Browse more */}
            <div className="bg-white border border-[#e2e6ed] rounded-2xl p-6">
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