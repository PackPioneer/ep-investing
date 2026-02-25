// app/api/investors/route.js
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: investors, error } = await supabase
      .from('vc_firms')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(investors);
  } catch (error) {
    console.error('Error fetching investors:', error);
    return Response.json(
      { message: "Error fetching investors" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const { data: investor, error } = await supabase
      .from('vc_firms')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return Response.json(investor);
  } catch (error) {
    console.error('Error creating investor:', error);
    return Response.json(
      { message: "Error creating investor" },
      { status: 500 }
    );
  }
}
