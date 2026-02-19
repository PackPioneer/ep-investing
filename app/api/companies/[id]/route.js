import connectDB from "@/lib/mongodb";
import Company from "@/models/Company";

export async function GET(_req, context) {
  await connectDB();

      // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

  const data = await Company.findById(id);
  return Response.json(data);
}

export async function PUT(req, context) {
  await connectDB();

      // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

  const body = await req.json();

  const data = await Company.findByIdAndUpdate(
    id,
    body,
    { new: true }
  );

  return Response.json(data);
}

export async function DELETE(_req, context) {
  await connectDB();

      // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

  await Company.findByIdAndDelete(id);

  return Response.json({ message: "Deleted" });
}
