import connectDB from "@/lib/mongodb";
import Grant from "@/models/Grant";

export async function GET(_req, context) {

      // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

  await connectDB();

  const data = await Grant.findById(id);

  return Response.json(data);
}

export async function PUT(req, context) {
  await connectDB();

        // ✅ unwrap params
    const { params } = context;
    const { id } = await params;

  const body = await req.json();

  const data = await Grant.findByIdAndUpdate(
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

  await Grant.findByIdAndDelete(id);

  return Response.json({ message: "Deleted" });
}
