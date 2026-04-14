"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { ArrowRight, X, CreditCard } from "lucide-react";

const PaywallContext = createContext(null);

const HARD_BLOCK_DATE = new Date("2025-06-01");

export function PaywallProvider({ children }) {
  const [hasPayment, setHasPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stripe/check-payment")
      .then(r => r.json())
      .then(d => { setHasPayment(d.hasPayment); setLoading(false); })
      .catch(() => { setHasPayment(false); setLoading(false); });
  }, []);

  const triggerPaywall = useCallback(() => {
    if (!hasPayment) setShowModal(true);
  }, [hasPayment]);

  const isHardBlock = new Date() >= HARD_BLOCK_DATE;

  return (
    <PaywallContext.Provider value={{ hasPayment, triggerPaywall, loading }}>
      {children}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(15,26,20,0.6)" }}>
          <div className="bg-white rounded-2xl border border-[#e2e6ed] max-w-md w-full p-8 relative">
            {!isHardBlock && (
              <button onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-[#718096] hover:text-[#0f1a14] transition-colors">
                <X size={18} />
              </button>
            )}
            <div className="w-12 h-12 rounded-xl bg-[#eef1f6] flex items-center justify-center mb-5">
              <CreditCard size={22} className="text-[#2d6a4f]" />
            </div>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-2">
              {isHardBlock ? "Subscription required" : "You're using EP Investing free"}
            </h2>
            <p className="text-[#4a5568] text-sm leading-relaxed mb-6">
              {isHardBlock
                ? "Your free access period has ended. Add a payment method to continue using EP Investing."
                : "Add your card now to keep access after July 15, 2025 — no charge until then. Cancel anytime before July 15th."}
            </p>
            <div className="flex flex-col gap-3">
              <a href="/pricing"
                className="w-full flex items-center justify-center gap-2 bg-[#2d6a4f] text-white font-semibold text-sm rounded-lg py-3 hover:bg-[#235a40] transition-all">
                Add payment method <ArrowRight size={14} />
              </a>
              {!isHardBlock && (
                <button onClick={() => setShowModal(false)}
                  className="w-full text-center text-xs text-[#718096] font-mono py-2 hover:text-[#0f1a14] transition-colors">
                  Remind me later
                </button>
              )}
            </div>
            {!isHardBlock && (
              <p className="text-xs text-[#a0aec0] font-mono text-center mt-4">
                Free until July 15, 2025 · No charge today
              </p>
            )}
          </div>
        </div>
      )}
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  return useContext(PaywallContext);
}