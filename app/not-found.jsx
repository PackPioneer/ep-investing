"use client";

import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 to-white px-6">

      <div className="max-w-xl w-full text-center">

        {/* 404 */}
        <h1 className="text-7xl md:text-8xl font-bold text-gray-900 tracking-tight">
          404
        </h1>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800 mt-4">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-500 mt-3 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Try searching or go back to the homepage.
        </p>

 

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">

          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition"
          >
            <Home size={16} />
            Home
          </Link>

          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 border px-6 py-3 rounded-lg hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>

        </div>

      </div>
    </div>
  );
}
