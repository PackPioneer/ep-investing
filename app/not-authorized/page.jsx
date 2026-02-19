"use client";

import Link from "next/link";
import { ShieldX, ArrowLeft, Home } from "lucide-react";

export default function NotAuthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-slate-100 px-6">
      
      <div className="max-w-md w-full bg-white shadow-xl rounded-2xl p-8 text-center border">

        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="bg-red-100 p-4 rounded-full">
            <ShieldX className="text-red-600" size={32} />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">
          Access Denied
        </h1>

        {/* Description */}
        <p className="text-gray-500 text-sm mb-6">
          You do not have permission to access this page.
          <br />
          Please contact the administrator if you believe this is a mistake.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3">

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-2.5 rounded-lg hover:bg-emerald-700 transition"
          >
            <Home size={16} />
            Go to Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border py-2.5 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

        </div>

      </div>
    </div>
  );
}
