import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Investor from "@/models/Investor";
import Company from "@/models/Company";
import Grant from "@/models/Grant";

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({});

  const regex = new RegExp(q, "i");

  const [investors, companies, grants] = await Promise.all([
    Investor.find({
      $or: [
        { name: regex },
        { focus: { $in: [regex] } },
      ],
    }).limit(10),

    Company.find({
      $or: [
        { name: regex },
        { tags: { $in: [regex] } },
      ],
    }).limit(10),

    Grant.find({
      $or: [
        { title: regex },
        { funder: regex },
        { tags: { $in: [regex] } },
      ],
    }).limit(10),
  ]);

  return NextResponse.json({
    investors,
    companies,
    grants,
  });
}