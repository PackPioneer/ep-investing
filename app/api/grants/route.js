// app/api/grants/route.js
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
const today = new Date().toISOString().split('T')[0];
const { data: grants, error } = await supabase
  .from('grants')
  .select('*')
  .or(`deadline_date.gte.${today},deadline_date.is.null`)
  .order('deadline_date', { ascending: true, nullsLast: true });

    if (error) throw error;

    return Response.json(grants);
  } catch (error) {
    console.error('Error fetching grants:', error);
    return Response.json(
      { message: "Error fetching grants" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const { data: grant, error } = await supabase
      .from('grants')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return Response.json(grant);
  } catch (error) {
    console.error('Error creating grant:', error);
    return Response.json(
      { message: "Error creating grant" },
      { status: 500 }
    );
  }
}
