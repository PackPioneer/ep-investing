import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];

export default clerkMiddleware(async (auth, req) => {
  const { method } = req;
  const { pathname } = req.nextUrl;

  const { userId } = await auth();

  // 🔐 ADMIN ROUTES
  if (isAdminRoute(req)) {
    // 1. If NOT logged in → redirect to login
    if (!userId) {
      return auth().redirectToSignIn(); // ✅ FIX
    }

    // 2. If logged in → check admin
    let isAdmin = false;

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

      isAdmin = ADMIN_EMAILS.includes(email);
    } catch (err) {
      console.error(err);
    }

    // 3. If not admin → redirect home
    if (!isAdmin) {
      return Response.redirect(new URL("/not-authorized", req.url));
    }
  }

  // 🔐 API protection
  if (pathname.startsWith("/api")) {
    if (method === "GET") return;

    if (!userId) {
      return auth().redirectToSignIn();
    }

    let isAdmin = false;

    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);

      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

      isAdmin = ADMIN_EMAILS.includes(email);
    } catch (err) {}

    if (!isAdmin) {
      return Response.json({ error: "Unauthorized" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};
