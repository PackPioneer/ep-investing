import { Mail, Linkedin, Twitter } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#e2e6ed] text-[#4a5568]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-6xl mx-auto px-6 py-16">

        {/* Top Section */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">

          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#2d6a4f] opacity-20 scale-150" />
                <div className="w-7 h-7 rounded-full bg-[#2d6a4f] flex items-center justify-center relative z-10">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
              <div>
                <span style={{ fontFamily: "Georgia, serif" }} className="text-[#0f1a14] text-lg font-normal">EP</span>
                <span className="font-mono text-[10px] text-[#4a5568] tracking-widest ml-1.5 uppercase">Investing</span>
              </div>
            </div>
            <p className="text-sm text-[#718096] leading-relaxed max-w-xs font-light">
              Climate & energy intelligence. Connecting founders, investors, NGOs, and experts across the energy transition.
            </p>
            <div className="flex gap-3 mt-6">
              <a href="mailto:otto@epinvesting.com"
                className="p-2 rounded-lg border border-[#e2e6ed] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                <Mail size={15} />
              </a>
              <a href="https://www.linkedin.com/company/the-energy-pioneer" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg border border-[#e2e6ed] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                <Linkedin size={15} />
              </a>
              <a href="https://x.com/energypioneer" target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg border border-[#e2e6ed] hover:border-[#2d6a4f] hover:text-[#2d6a4f] transition-all">
                <Twitter size={15} />
              </a>
            </div>
          </div>

          {/* Discover */}
          <div>
            <h4 className="text-xs font-mono text-[#0f1a14] uppercase tracking-widest mb-4">Discover</h4>
            <ul className="space-y-3 text-sm flex flex-col">
              <Link href="/search" className="hover:text-[#2d6a4f] transition-colors">Companies</Link>
              <Link href="/investors" className="hover:text-[#2d6a4f] transition-colors">Investors</Link>
              <Link href="/grants" className="hover:text-[#2d6a4f] transition-colors">Grants</Link>
              <Link href="/experts" className="hover:text-[#2d6a4f] transition-colors">Experts</Link>
              <Link href="/ngos" className="hover:text-[#2d6a4f] transition-colors">NGOs</Link>
              <Link href="/jobs" className="hover:text-[#2d6a4f] transition-colors">Jobs</Link>
              <Link href="/insights" className="hover:text-[#2d6a4f] transition-colors">Insights</Link>
            </ul>
          </div>

          {/* Get Started */}
          <div>
            <h4 className="text-xs font-mono text-[#0f1a14] uppercase tracking-widest mb-4">Get Started</h4>
            <ul className="space-y-3 text-sm flex flex-col">
              <Link href="/onboarding/company" className="hover:text-[#2d6a4f] transition-colors">Claim your company</Link>
              <Link href="/onboarding/investor" className="hover:text-[#2d6a4f] transition-colors">Investor access</Link>
              <Link href="/onboarding/expert" className="hover:text-[#2d6a4f] transition-colors">Join as expert</Link>
              <Link href="/onboarding/ngo" className="hover:text-[#2d6a4f] transition-colors">List your NGO</Link>
              <Link href="/get-matched" className="hover:text-[#2d6a4f] transition-colors">Get matched</Link>
              <Link href="/jobs" className="hover:text-[#2d6a4f] transition-colors">Post a job</Link>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-mono text-[#0f1a14] uppercase tracking-widest mb-4">Company</h4>
            <ul className="space-y-3 text-sm flex flex-col">
              <Link href="/about" className="hover:text-[#2d6a4f] transition-colors">About</Link>
              <a href="mailto:otto@epinvesting.com" className="hover:text-[#2d6a4f] transition-colors">Contact</a>
              <Link href="/pricing" className="hover:text-[#2d6a4f] transition-colors">Pricing</Link>
              <Link href="/privacy-policy" className="hover:text-[#2d6a4f] transition-colors">Privacy Policy</Link>
              <Link href="/terms-and-conditions" className="hover:text-[#2d6a4f] transition-colors">Terms of Service</Link>
              <Link href="/disclaimer" className="hover:text-[#2d6a4f] transition-colors">Disclaimer</Link>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[#e2e6ed] mt-14 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs font-mono text-[#a0aec0]">
           © {new Date().getFullYear()} EP Investing. All rights reserved.
          </p>
          <p className="text-xs font-mono text-[#a0aec0]">
            epinvesting.com
          </p>
        </div>

      </div>
    </footer>
  )
}
