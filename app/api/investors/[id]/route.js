import connectDB from "@/lib/mongodb";
import Investor from "@/models/Investor";
import { NextResponse } from "next/server";

export async function GET(_request, context) {
  try {
    await connectDB();

    // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

    const investor = await Investor.findById(id);

    if (!investor) {
      return NextResponse.json(
        { message: "Investor not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(investor);
  } catch (error) {
    return NextResponse.json(
      { message: "Error fetching investor", error: error.message },
      { status: 500 }
    );
  }
}
export async function PUT(req, context) {
  try {
    await connectDB();

        // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

    const body = await req.json();

    const updated = await Investor.findByIdAndUpdate(
      id,
      body,
      { new: true }
    );

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ message: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_req, context) {
  try {
    await connectDB();

    // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

    await Investor.findByIdAndDelete(id);

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  }
}
