import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Investor from "@/models/Investor";
import Company from "@/models/Company";
import Grant from "@/models/Grant";
import Subscriber from "@/models/Subscriber";

function getDateRange(filter) {
  const now = new Date();
  let start, prevStart;

  const map = {
    "1d": 1,
    "7d": 7,
    "28d": 28,
    "1y": 365,
  };

  if (!map[filter]) return { start: null, prevStart: null, now };

  const days = map[filter];

  start = new Date(now - days * 24 * 60 * 60 * 1000);
  prevStart = new Date(start - days * 24 * 60 * 60 * 1000);

  return { start, prevStart, now };
}

async function getStats(Model, filter) {
  const { start, prevStart, now } = getDateRange(filter);

  if (!start) {
    const total = await Model.countDocuments();
    return { current: total, previous: 0, growth: 0 };
  }

  const current = await Model.countDocuments({
    createdAt: { $gte: start, $lte: now },
  });

  const previous = await Model.countDocuments({
    createdAt: { $gte: prevStart, $lt: start },
  });

  const growth =
    previous === 0
      ? current > 0
        ? 100
        : 0
      : ((current - previous) / previous) * 100;

  return { current, previous, growth };
}

export async function GET(req) {
  await dbConnect();

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") || "7d";

  const [investors, companies, grants, subscribers] = await Promise.all([
    getStats(Investor, filter),
    getStats(Company, filter),
    getStats(Grant, filter),
    getStats(Subscriber, filter),
  ]);

  return NextResponse.json({
    investors,
    companies,
    grants,
    subscribers,
  });
}
