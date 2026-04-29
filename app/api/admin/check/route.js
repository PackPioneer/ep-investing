import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const userId = await requireAdmin();
  return Response.json({ admin: !!userId });
}
