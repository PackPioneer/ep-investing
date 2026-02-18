import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isAdminRoute = createRouteMatcher([
  "/admin(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { method } = req;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin/login")) {
    return;
  }

  if (isAdminRoute(req)) {
    await auth.protect();
  }

  if (req.nextUrl.pathname.startsWith("/api") && method !== "GET") {
    await auth.protect();
  }
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};