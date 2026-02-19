import { NextResponse } from "next/server";
import Subscriber from "@/models/Subscriber";
import connectDB from "@/lib/mongodb";

export async function GET() {
  await connectDB();
  const data = await Subscriber.find().sort({ createdAt: -1 });
  return Response.json(data);
}

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { message: "Invalid email address" },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await Subscriber.findOne({ email });

    if (existing) {
      return NextResponse.json(
        { message: "Already subscribed" },
        { status: 400 }
      );
    }

    await Subscriber.create({ email });

    return NextResponse.json(
      { message: "Subscribed successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
