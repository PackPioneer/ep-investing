import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Investor from "@/models/Investor";
import Company from "@/models/Company";
import Grant from "@/models/Grant";
import Subscriber from "@/models/Subscriber";

const models = {
  investors: Investor,
  companies: Company,
  grants: Grant,
  subscribers: Subscriber,
};

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "investors";

  const Model = models[type];

  if (!Model) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  const data = await Model.aggregate([
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$createdAt",
          },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return NextResponse.json(data);
}
