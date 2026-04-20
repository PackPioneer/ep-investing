export default function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-[#f2f4f8]" style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
      <div className="max-w-3xl mx-auto px-6 py-20">
        <div className="mb-12">
          <p className="text-xs font-mono text-[#2d6a4f] uppercase tracking-widest mb-3">Legal</p>
          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-4xl text-[#0f1a14] mb-4">Disclaimer</h1>
          <p className="text-sm text-[#718096] font-mono">Last updated: April 2026</p>
        </div>

        <div className="flex flex-col gap-8 text-[#4a5568] text-sm leading-relaxed">

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Not financial advice</h2>
            <p>Nothing on EP Investing constitutes financial, investment, legal, or tax advice. All information provided on this platform is for general informational purposes only and should not be relied upon as the sole basis for any investment or business decision. You should consult with qualified professionals before making any financial or investment decisions.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">No verification of listings</h2>
            <p>EP Investing does not independently verify the accuracy, completeness, or legitimacy of information provided by companies, investors, or experts listed on the platform. Profiles, descriptions, funding data, and other content are submitted by users and may not reflect current or accurate information. EP Investing makes no representations or warranties regarding the accuracy of any listing.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Not a broker or investment advisor</h2>
            <p>EP Investing is not a registered broker-dealer, investment advisor, funding portal, or financial institution. We do not facilitate investment transactions, hold client funds, provide investment recommendations, or act as an intermediary in any financial transaction. Any connection made between parties through this platform is independent of EP Investing.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Investment risk</h2>
            <p>Investing in early-stage companies involves substantial risk, including the potential loss of your entire investment. Past performance of any company, sector, or investment described on this platform is not indicative of future results. The energy transition and climate sectors are subject to regulatory, technological, and market risks that may materially affect the value of any investment.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Third-party content</h2>
            <p>EP Investing may contain links to third-party websites, reports, or resources. We do not endorse or assume responsibility for any content, products, or services offered by third parties. Access to third-party content is at your own risk.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Limitation of liability</h2>
            <p>By using this platform, you agree that EP Investing, its founders, employees, and affiliates bear no responsibility or liability for any decisions made, losses incurred, or actions taken based on information found on this platform. Use of EP Investing is entirely at your own risk.</p>
          </div>

          <div className="bg-white border border-[#e2e6ed] rounded-2xl p-8">
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-xl text-[#0f1a14] mb-4">Contact</h2>
            <p>If you have questions about this disclaimer, please contact us at <a href="mailto:info@epinvesting.com" className="text-[#2d6a4f] hover:underline">info@epinvesting.com</a>.</p>
          </div>

        </div>
      </div>
    </div>
  );
}