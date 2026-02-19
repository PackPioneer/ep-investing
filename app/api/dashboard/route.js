import connectDB from "@/lib/mongodb";
// import connectDB from "@/lib/db";
import Investor from "@/models/Investor";
import Company from "@/models/Company";
import Grant from "@/models/Grant";
import Subscriber from "@/models/Subscriber";

export async function GET(req) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "lifetime";

  let days = null;

  if (range === "1d") days = 1;
  if (range === "7d") days = 7;
  if (range === "28d") days = 28;
  if (range === "1y") days = 365;

  const now = new Date();
  let fromDate = null;

  if (days) {
    fromDate = new Date();
    fromDate.setDate(now.getDate() - days);
  }

  const match = fromDate ? { createdAt: { $gte: fromDate } } : {};

  // TOTALS
  const [investors, companies, grants, subscribers] =
    await Promise.all([
      Investor.countDocuments(match),
      Company.countDocuments(match),
      Grant.countDocuments(match),
      Subscriber.countDocuments(match),
    ]);

  // GROUP BY DATE
  const groupByDate = async (Model) => {
    const data = await Model.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return data;
  };

  const [investorChart, companyChart, grantChart, subscriberChart] =
    await Promise.all([
      groupByDate(Investor),
      groupByDate(Company),
      groupByDate(Grant),
      groupByDate(Subscriber),
    ]);

  return Response.json({
    totals: {
      investors,
      companies,
      grants,
      subscribers,
    },
    charts: {
      investors: investorChart,
      companies: companyChart,
      grants: grantChart,
      subscribers: subscriberChart,
    },
  });
}