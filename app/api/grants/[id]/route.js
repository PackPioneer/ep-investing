// app/api/grants/[id]/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data: grant, error } = await supabase
      .from('grants')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!grant) {
      return Response.json(
        { message: "Grant not found" },
        { status: 404 }
      );
    }

    return Response.json(grant);
  } catch (error) {
    console.error('Error fetching grant:', error);
    return Response.json(
      { message: "Error fetching grant" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const { data: grant, error } = await supabase
      .from('grants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(grant);
  } catch (error) {
    console.error('Error updating grant:', error);
    return Response.json(
      { message: "Error updating grant" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('grants')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ message: "Grant deleted" });
  } catch (error) {
    console.error('Error deleting grant:', error);
    return Response.json(
      { message: "Error deleting grant" },
      { status: 500 }
    );
  }
}
