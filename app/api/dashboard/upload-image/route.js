/**
 * app/api/dashboard/upload-image/route.js
 *
 * Upload an image (e.g. a press-release photo) to a public bucket and return its
 * URL. The composer stores the URL on the announcement's meta.image_url.
 */

import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "announcement-images";
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg", "image/webp": "webp", "image/gif": "gif" };

export async function POST(req) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dataUrl } = await req.json().catch(() => ({}));
  const m = typeof dataUrl === "string" && dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!m) return NextResponse.json({ error: "Invalid image" }, { status: 400 });
  const contentType = m[1];
  const buffer = Buffer.from(m[2], "base64");
  if (buffer.length > 5_000_000) return NextResponse.json({ error: "Image too large (max 5MB)" }, { status: 400 });

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});
  const path = `${userId}/${Date.now()}.${EXT[contentType] || "png"}`;
  const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: true });
  if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });
  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  if (!pub?.publicUrl) return NextResponse.json({ error: "Could not get public URL" }, { status: 500 });
  return NextResponse.json({ url: pub.publicUrl });
}
