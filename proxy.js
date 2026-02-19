import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];

export default clerkMiddleware(async (auth, req) => {

  const { method } = req;
  const { pathname } = req.nextUrl;

  const { userId } = await auth();

  let isAdmin = false;

  if (userId) {
    try {
      const client = await clerkClient(); // ✅ FIX HERE

      const user = await client.users.getUser(userId);

      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();


      isAdmin = ADMIN_EMAILS.includes(email);


    } catch (err) {
      console.error("Clerk error:", err);
    }
  }

  // 🔐 Admin pages
  if (isAdminRoute(req)) {
    await auth.protect();

    if (!isAdmin) {
      return Response.redirect(new URL("/", req.url));
    }
  }

  // 🔐 API protection
  if (pathname.startsWith("/api")) {
    if (method === "GET") return;

    await auth.protect();

    if (!isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
