"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus("idle");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.message);
      } else {
        setStatus("success");
        setMessage("You're subscribed.");
        setEmail("");
      }
    } catch (err) {
      setStatus("error");
      setMessage("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <section className="relative pb-28 bg-linear-to-b from-white to-slate-50 overflow-hidden">
      
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900"
        >
          Get weekly EP Investing updates
        </motion.h2>

        <p className="text-slate-600 mt-6 text-lg">
          Institutional-grade insights on climate capital and funding opportunities.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4 bg-white border border-slate-200 rounded-xl p-3 shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/30 transition"
        >
          <input
            type="email"
            required
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 px-4 py-3 outline-none text-sm md:text-base bg-transparent"
          />

          <button
            type="submit"
            disabled={loading}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white text-sm font-medium shadow-md hover:bg-emerald-700 transition disabled:opacity-70"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Subscribing
              </>
            ) : (
              "Subscribe"
            )}
          </button>
        </form>

        {status !== "idle" && (
          <div
            className={`mt-4 flex items-center justify-center gap-2 text-sm ${
              status === "success"
                ? "text-emerald-600"
                : "text-red-500"
            }`}
          >
            {status === "success" ? (
              <CheckCircle2 size={16} />
            ) : (
              <AlertCircle size={16} />
            )}
            {message}
          </div>
        )}

        <p className="text-xs text-slate-400 mt-4">
          No spam. Only signal.
        </p>
      </div>
    </section>
  );
}
