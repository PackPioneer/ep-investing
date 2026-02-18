import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";

export async function GET(req, { params }) {
  await connectDB();
  const data = await Company.findById(params.id);
  return Response.json(data);
}

export async function PUT(req, { params }) {
  await connectDB();
  const body = await req.json();

  const data = await Company.findByIdAndUpdate(
    params.id,
    body,
    { new: true }
  );

  return Response.json(data);
}

export async function DELETE(req, { params }) {
  await connectDB();

  await Company.findByIdAndDelete(params.id);

  return Response.json({ message: "Deleted" });
}
