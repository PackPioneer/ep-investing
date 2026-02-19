import { clerkMiddleware, createRouteMatcher, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// 1. Define routes that require Admin check
// We use a negative lookahead (?!/login) to ensure the login page itself isn't protected by this rule
const isAdminRoute = createRouteMatcher(["/admin((?!/login).*)"]);

const ADMIN_EMAILS =
  process.env.ADMIN_EMAILS?.split(",").map(e => e.trim().toLowerCase()) || [];

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();
  const { pathname } = req.nextUrl;

  // 🔐 PROTECT ADMIN ROUTES
  if (isAdminRoute(req)) {
    // If not logged in, Clerk handles the redirect to your sign-in page
    if (!userId) {
      const { redirectToSignIn } = await auth();
      return redirectToSignIn({ returnBackUrl: req.url });
    }

    // If logged in, check if they are in the allowed email list
    try {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

      if (!ADMIN_EMAILS.includes(email || "")) {
        // Redirect non-admins to a safe page
        return NextResponse.redirect(new URL("/not-authorized", req.url));
      }
    } catch (err) {
      console.error("Clerk Error:", err);
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // 🔐 API PROTECTION
  if (pathname.startsWith("/api") && req.method !== "GET") {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Admin check for API
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();

    if (!ADMIN_EMAILS.includes(email || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};