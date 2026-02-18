"use client";

import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }) {
  return (
    // <div className="flex min-h-screen bg-slate-50">
    //   <Sidebar />
    //   <main className="flex-1 p-6 md:p-10">
    //     {children}
    //   </main>
    // </div>


 <div className="bg-gray-50">
  <Sidebar />

  <main className="p-6 md:pl-64 min-h-screen overflow-y-auto">
    {children}
  </main>
</div>
  );
}
