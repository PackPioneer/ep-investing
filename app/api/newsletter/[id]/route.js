import connectDB from "@/lib/mongodb";
import Subscriber from "@/models/Subscriber";
import { NextResponse } from "next/server";

export async function DELETE(_req, context) {
  try {
    await connectDB();

    const { params } = context;
    const {id} = await params;

  await Subscriber.findByIdAndDelete(id);

  return NextResponse.json({ message: "Deleted" })
  } catch (error) {
    return NextResponse.json({ message: "Delete failed" }, { status: 500 });
  };
}
