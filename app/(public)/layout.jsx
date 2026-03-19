import Footer from "@/components/Footer";
import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <>
      {/* LAUNCH BANNER */}
      <div className="w-full bg-[#0f1a14] text-center py-2.5 px-4">
        <p className="text-xs text-[#a0b8a8] font-mono">
          🌱 EP Investing is in early access —{" "}
          <Link href="/pricing" className="text-white font-semibold hover:text-[#2d6a4f] transition-colors">
            join the waitlist
          </Link>
          {" "}for full access launching{" "}
          <span className="text-[#2d6a4f] font-semibold">April 15</span>
        </p>
      </div>
      <main>{children}</main>
      <Footer />
    </>
  );
}