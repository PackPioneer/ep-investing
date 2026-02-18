import connectDB from "@/lib/mongodb";
import Grant from "@/models/Grant";

export async function GET(req, { params }) {
  await connectDB();

  const data = await Grant.findById(params.id);

  return Response.json(data);
}

export async function PUT(req, { params }) {
  await connectDB();

  const body = await req.json();

  const data = await Grant.findByIdAndUpdate(
    params.id,
    body,
    { new: true }
  );

  return Response.json(data);
}

export async function DELETE(req, { params }) {
  await connectDB();

  await Grant.findByIdAndDelete(params.id);

  return Response.json({ message: "Deleted" });
}
