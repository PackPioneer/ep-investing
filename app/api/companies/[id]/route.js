// app/api/companies/[id]/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    // Await params in Next.js 15+
    const { id } = await params;

    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!company) {
      return Response.json(
        { message: "Company not found" },
        { status: 404 }
      );
    }

    return Response.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return Response.json(
      { message: "Error fetching company" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const { data: company, error } = await supabase
      .from('companies')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(company);
  } catch (error) {
    console.error('Error updating company:', error);
    return Response.json(
      { message: "Error updating company" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ message: "Company deleted" });
  } catch (error) {
    console.error('Error deleting company:', error);
    return Response.json(
      { message: "Error deleting company" },
      { status: 500 }
    );
  }
}
