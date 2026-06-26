import Footer from "@/components/Footer";
import Link from "next/link";

export default function PublicLayout({ children }) {
  return (
    <>
      <div className="w-full bg-[#0f1a14] py-3.5 px-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-center">
          <p className="text-sm text-[#cdddd2]">
            <span className="text-[#7fb89c]">●</span>{" "}
            EP Network is now open —{" "}
            <span className="text-white font-semibold">free through January 1, 2027</span>
          </p>
          <Link href="/get-started"
            className="inline-flex items-center gap-1.5 bg-[#2d6a4f] text-white text-xs font-semibold rounded-full px-4 py-1.5 hover:bg-[#358560] transition-colors">
            Get started free →
          </Link>
        </div>
      </div>
      <main>{children}</main>
      <Footer />
    </>
  );
}