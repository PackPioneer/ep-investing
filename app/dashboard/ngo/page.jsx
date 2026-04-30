import Link from "next/link";
import { getOwnedNgo } from "@/lib/ngo-owner";
import { supabase } from "@/lib/supabase";
import { FileText, Briefcase, Plus, ArrowRight, Handshake, MapPin } from "lucide-react";

export default async function NGODashboardOverview() {
  const { ngo } = await getOwnedNgo();

  // Counts
  const [{ count: grantCount }, { count: jobCount }] = await Promise.all([
    supabase.from("grants").select("id", { count: "exact", head: true }).eq("ngo_id", ngo.id),
    supabase.from("job_listings").select("id", { count: "exact", head: true }).eq("ngo_id", ngo.id),
  ]);

  const profileComplete =
    !!ngo.short_description && !!ngo.bio && (ngo.sector_tags?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-6">

      {/* Profile completeness banner */}
      {!profileComplete && (
        <div className="bg-[#fff7e6] border border-[#f5d99a] rounded-xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="font-semibold text-[#7a4d00] text-sm">Complete your profile</div>
            <div className="text-xs text-[#7a4d00] opacity-80 mt-0.5">
              A complete profile gets ~3x more visibility in the directory.
            </div>
          </div>
          <Link href="/dashboard/ngo/profile"
            className="bg-[#7a4d00] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#5e3a00] transition-colors flex items-center gap-1.5">
            Complete now <ArrowRight size={13} />
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/ngo/grants"
          className="bg-white border border-[#e2e6ed] hover:border-[#2d6a4f] rounded-xl p-5 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
              <FileText size={18} className="text-[#2d6a4f]" />
            </div>
            <ArrowRight size={14} className="text-[#c8d8cc] group-hover:text-[#2d6a4f] transition-colors" />
          </div>
          <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-1">
            {grantCount ?? 0}
          </div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide">Grant programs published</div>
        </Link>

        <Link href="/dashboard/ngo/jobs"
          className="bg-white border border-[#e2e6ed] hover:border-[#2d6a4f] rounded-xl p-5 transition-all group">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-lg bg-[#eef1f6] flex items-center justify-center">
              <Briefcase size={18} className="text-[#2d6a4f]" />
            </div>
            <ArrowRight size={14} className="text-[#c8d8cc] group-hover:text-[#2d6a4f] transition-colors" />
          </div>
          <div style={{ fontFamily: "Georgia, serif" }} className="text-3xl text-[#0f1a14] mb-1">
            {jobCount ?? 0}
          </div>
          <div className="text-xs font-mono text-[#718096] uppercase tracking-wide">Open positions posted</div>
        </Link>
      </div>

      {/* Quick actions */}
      <div className="bg-white border border-[#e2e6ed] rounded-xl p-6">
        <h2 className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Quick actions</h2>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard/ngo/grants/new"
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-sm font-semibold rounded-lg px-4 py-2 hover:bg-[#235a40] transition-colors">
            <Plus size={13} /> New grant
          </Link>
          <Link href="/dashboard/ngo/jobs/new"
            className="inline-flex items-center gap-1.5 bg-white border border-[#d0d6e0] text-[#0f1a14] text-sm font-semibold rounded-lg px-4 py-2 hover:border-[#2d6a4f] transition-colors">
            <Plus size={13} /> New job
          </Link>
          <Link href="/dashboard/ngo/profile"
            className="inline-flex items-center gap-1.5 bg-white border border-[#d0d6e0] text-[#0f1a14] text-sm font-semibold rounded-lg px-4 py-2 hover:border-[#2d6a4f] transition-colors">
            Edit profile
          </Link>
        </div>
      </div>

      {/* Profile snapshot */}
      <div className="bg-white border border-[#e2e6ed] rounded-xl p-6">
        <h2 className="text-xs font-mono font-semibold text-[#0f1a14] uppercase tracking-wide mb-4">Your profile</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex items-start gap-2">
            <MapPin size={13} className="text-[#718096] mt-0.5 flex-shrink-0" />
            <div className="text-[#4a5568]">
              {[ngo.headquarters_city, ngo.headquarters_country].filter(Boolean).join(", ") || "Location not set"}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Handshake size={13} className="text-[#718096] mt-0.5 flex-shrink-0" />
            <div className="text-[#4a5568]">
              {ngo.open_to_partnerships ? (
                <>
                  Open to partnerships
                  {ngo.partnership_description && <span className="block text-xs mt-1 text-[#718096]">{ngo.partnership_description}</span>}
                </>
              ) : (
                <span className="text-[#a0aec0]">Not currently open to partnerships</span>
              )}
            </div>
          </div>
          {ngo.sector_tags?.length > 0 && (
            <div>
              <div className="text-[10px] font-mono text-[#718096] uppercase tracking-wider mb-1.5">Sector focus</div>
              <div className="flex flex-wrap gap-1">
                {ngo.sector_tags.map(s => (
                  <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#eef1f6] text-[#2d6a4f] capitalize">
                    {s.replace(/-/g, " ")}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
