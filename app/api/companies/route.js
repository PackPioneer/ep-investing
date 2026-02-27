import { supabase } from "@/lib/supabase";

export async function GET() {
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .order('id', { ascending: true })
    .limit(50);

  if (error) {
    return Response.json({ message: error.message, details: error }, { status: 500 });
  }

  return Response.json(companies);
}