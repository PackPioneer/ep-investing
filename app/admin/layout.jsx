"use client";

/**
 * Admin layout — gates ALL /admin/* pages.
 *
 * Replaces the previous unauthenticated layout. Any user not in the
 * ADMIN_USER_IDS env var gets redirected to / (or shown a "not authorized"
 * page if they're not signed in).
 */

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      // Not signed in — bounce to home
      router.replace("/");
      return;
    }

    // Check admin status server-side
    fetch("/api/admin/check")
      .then((r) => r.json())
      .then((data) => {
        if (data.admin) {
          setAuthorized(true);
        } else {
          setAuthorized(false);
          router.replace("/");
        }
      })
      .catch(() => {
        setAuthorized(false);
        router.replace("/");
      });
  }, [isLoaded, isSignedIn, user, router]);

  if (authorized !== true) {
    return (
      <div className="min-h-screen bg-[#f2f4f8] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50">
      <Sidebar />
      <main className="p-6 md:pl-64 min-h-screen overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
