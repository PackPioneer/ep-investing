"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

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
        headers: { "Content-Type": "application/json" },
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
    } catch {
      setStatus("error");
      setMessage("Something went wrong.");
    }

    setLoading(false);
  };

  return (
    <section className="relative pb-20 bg-linear-to-b from-white to-slate-50 overflow-hidden">
      <div className="max-w-3xl mx-auto px-5 sm:px-6 text-center">

        {/* Heading */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-slate-900"
        >
          Get weekly EP Investing updates
        </motion.h2>

        <p className="text-slate-600 mt-5 text-base sm:text-lg max-w-xl mx-auto">
          Institutional-grade insights on climate capital and funding opportunities.
        </p>

        {/* Form Wrapper */}
        <form
          onSubmit={handleSubmit}
          className="mt-10"
        >
          <div className="
            flex flex-col
            sm:flex-row
            gap-3
            sm:gap-0
            bg-white
            border
            border-slate-200
            rounded-2xl
            shadow-lg
            overflow-hidden
            max-w-xl
            mx-auto
          ">

            {/* Input */}
            <input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="
                w-full
                px-5
                py-4
                text-sm
                sm:text-base
                outline-none
                bg-transparent
              "
            />

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full
                sm:w-auto
                px-6
                py-4
                sm:py-0
                bg-emerald-600
                text-white
                text-sm
                font-medium
                hover:bg-emerald-700
                transition
                flex
                items-center
                justify-center
                gap-2
                disabled:opacity-70
              "
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
          </div>
        </form>

        {/* Status Message */}
        {status !== "idle" && (
          <div
            className={`mt-5 flex items-center justify-center gap-2 text-sm ${
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

        <p className="text-xs text-slate-400 mt-5">
          No spam. Only signal.
        </p>
      </div>
    </section>
  );
}
