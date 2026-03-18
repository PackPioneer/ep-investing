import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data: investor, error } = await supabase
      .from("vc_firms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!investor) {
      return Response.json({ message: "Investor not found" }, { status: 404 });
    }

    return Response.json(investor);
  } catch (error) {
    console.error("Error fetching investor:", error);
    return Response.json({ message: "Error fetching investor" }, { status: 500 });
  }
}
