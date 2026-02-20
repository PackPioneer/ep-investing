import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Investor from "@/models/Investor";
import Company from "@/models/Company";
import Grant from "@/models/Grant";

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    if (!q) return NextResponse.json({ investors: [], companies: [], grants: [] });

    const regex = new RegExp(q, "i");

    const [investors, companies, grants] = await Promise.all([
      Investor.find({
        $or: [{ name: regex }, { focus: regex }], // MongoDB handles regex in arrays automatically
      }).limit(10).lean(),

      Company.find({
        $or: [{ name: regex }, { tags: regex }],
      }).limit(10).lean(),

      Grant.find({
        $or: [{ title: regex }, { funder: regex }, { tags: regex }],
      }).limit(10).lean(),
    ]);

    return NextResponse.json({ investors, companies, grants });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}