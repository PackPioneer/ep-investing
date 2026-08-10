import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 300;

// Live listing counts for the homepage "by the numbers" bar. Each count is
// resilient — if a table/column differs, it falls back to null and the UI shows
// a sensible default instead of breaking.
export async function GET() {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const count = async (table, filter) => {
    try {
      let q = supabase.from(table).select("*", { count: "exact", head: true });
      if (filter) q = filter(q);
      const { count: c } = await q;
      return typeof c === "number" ? c : null;
    } catch { return null; }
  };

  const [companies, grants, jobs, ngos, investors] = await Promise.all([
    count("companies", (q) => q.neq("is_hidden", true)),
    count("grants"),
    count("job_listings", (q) => q.eq("status", "published")),
    count("ngos"),
    count("vc_firms"),
  ]);

  return Response.json({ companies, investors, grants, jobs, ngos });
}
