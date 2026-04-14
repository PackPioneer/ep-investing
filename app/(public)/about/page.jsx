import Link from "next/link";

export const metadata = {
  title: "About | EP Investing",
  description: "EP Investing is a climate and energy intelligence platform connecting founders, investors, and experts across the energy transition.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-20">

        <div className="inline-flex items-center gap-2 text-[#2d6a4f] text-xs font-mono tracking-widest uppercase border border-[#c8d8cc] bg-[#eef1f6] rounded-full px-3 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#2d6a4f]" /> About
        </div>

        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl text-[#0f1a14] mb-6 leading-tight">
          Built for the energy transition.
        </h1>

        <p className="text-[#4a5568] text-lg leading-relaxed mb-8 font-light">
          EP Investing is a climate and energy intelligence platform — a structured directory of companies, investors, grants, and experts across the global energy transition.
        </p>

        <div className="border-t border-[#e2e6ed] pt-10 mb-10">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-4">Why we built this</h2>
          <p className="text-[#4a5568] leading-relaxed mb-4">
            The climate and energy space moves fast. Founders spend weeks finding the right investors. Investors struggle to discover early-stage companies outside their immediate network. Grants go unclaimed because no one knows they exist.
          </p>
          <p className="text-[#4a5568] leading-relaxed">
            EP Investing brings structure to this chaos — curated data, organized by sector, with the signals that matter: who's raising, who's hiring, and where the capital is flowing.
          </p>
        </div>

        <div className="border-t border-[#e2e6ed] pt-10 mb-10">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-6">What we cover</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              "Solar & Wind", "Battery Storage", "Green Hydrogen", "Nuclear Technologies",
              "Carbon Markets", "EV Charging", "Electric Aviation", "SAF / Efuels",
              "Geothermal", "Energy Efficiency", "Climate Finance", "Industrial Decarbonization"
            ].map(sector => (
              <div key={sector} className="bg-white border border-[#e2e6ed] rounded-lg px-4 py-3 text-sm text-[#0f1a14]">
                {sector}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-[#e2e6ed] pt-10 mb-10">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-2xl text-[#0f1a14] mb-4">The team</h2>
          <p className="text-[#4a5568] leading-relaxed">
            EP Investing is built by <a href="https://theenergypioneer.com" target="_blank" rel="noopener noreferrer" className="text-[#2d6a4f] hover:underline">The Energy Pioneer</a> — a media and intelligence company covering the global energy transition. Questions? Reach us at <a href="mailto:info@epinvesting.com" className="text-[#2d6a4f] hover:underline">info@epinvesting.com</a>.
          </p>
        </div>

        <div className="flex gap-4 flex-wrap">
          <Link href="/search" className="bg-[#2d6a4f] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#235a40] transition-colors">
            Browse companies
          </Link>
          <Link href="/pricing" className="border border-[#2d6a4f] text-[#2d6a4f] text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#eef1f6] transition-colors">
            Get access
          </Link>
        </div>

      </div>
    </div>
  );
}