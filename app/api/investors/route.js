import connectDB from "@/lib/mongodb";
import Investor from "@/models/Investor";

export async function GET() {
  try {
    await connectDB();

    const investors = await Investor.find().sort({ createdAt: -1 });

    return Response.json(investors);
  } catch (error) {
    return Response.json(
      { message: "Error fetching investors" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    const investor = await Investor.create(data);

    return Response.json(investor);
  } catch (error) {
    return Response.json(
      { message: "Error creating investor" },
      { status: 500 }
    );
  }
}
