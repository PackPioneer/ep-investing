// app/api/investors/[id]/route.js
import { supabase } from "@/lib/supabase";

export async function GET(req, { params }) {
  try {
    const { id } = await params;

    const { data: investor, error } = await supabase
      .from('vc_firms')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    if (!investor) {
      return Response.json(
        { message: "Investor not found" },
        { status: 404 }
      );
    }

    return Response.json(investor);
  } catch (error) {
    console.error('Error fetching investor:', error);
    return Response.json(
      { message: "Error fetching investor" },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const updates = await req.json();

    const { data: investor, error } = await supabase
      .from('vc_firms')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json(investor);
  } catch (error) {
    console.error('Error updating investor:', error);
    return Response.json(
      { message: "Error updating investor" },
      { status: 500 }
    );
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('vc_firms')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return Response.json({ message: "Investor deleted" });
  } catch (error) {
    console.error('Error deleting investor:', error);
    return Response.json(
      { message: "Error deleting investor" },
      { status: 500 }
    );
  }
}
