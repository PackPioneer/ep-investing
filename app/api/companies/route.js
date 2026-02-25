// app/api/companies/route.js
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return Response.json(companies);
  } catch (error) {
    return Response.json(
      { message: "Error fetching companies" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const data = await req.json();

    const { data: company, error } = await supabase
      .from('companies')
      .insert([data])
      .select()
      .single();

    if (error) throw error;

    return Response.json(company);
  } catch (error) {
    return Response.json(
      { message: "Error creating company" },
      { status: 500 }
    );
  }
}
