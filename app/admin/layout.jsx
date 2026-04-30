import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/admin";
import Sidebar from "@/components/Sidebar";

export default async function AdminLayout({ children }) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    redirect("/");
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
