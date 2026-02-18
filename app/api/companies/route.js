import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";

export async function GET() {
  try {
    await connectDB();

    const companies = await Company.find().sort({ createdAt: -1 });

    return Response.json(companies);
  } catch (error) {
    return Response.json(
      { message: "Error fetching companies" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const data = await req.json();

    const company = await Company.create(data);

    return Response.json(company);
  } catch (error) {
    return Response.json(
      { message: "Error creating company" },
      { status: 500 }
    );
  }
}
