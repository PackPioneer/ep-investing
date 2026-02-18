import connectDB from "@/lib/mongodb";
import Grant from "@/models/Grant";

export async function GET() {
  try {
    await connectDB();

    const grants = await Grant.find().sort({ deadline: 1 });

    return Response.json(grants);
  } catch (error) {
    return Response.json(
      { message: "Error fetching grants" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    const grant = await Grant.create(data);

    return Response.json(grant);
  } catch (error) {
    return Response.json(
      { message: "Error creating grant" },
      { status: 500 }
    );
  }
}
