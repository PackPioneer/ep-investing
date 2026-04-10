import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ status: null });

  const { data } = await supabase
    .from("companies")
    .select("status")
    .eq("clerk_user_id", userId)
    .single();

  return NextResponse.json({ status: data?.status || null });
}