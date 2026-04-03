// app/privacy-policy/page.jsx

export const metadata = {
  title: "Privacy Policy | EP Investing",
  description:
    "Learn how EP Investing collects, uses, and protects your personal information while using our platform.",
};

export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-32 text-gray-700">
      <h1 className="text-4xl font-bold mb-6 text-black">Privacy Policy</h1>
      <p className="mb-6 text-sm text-gray-500">Last updated: February 2026</p>

      <section className="space-y-6">
        <p>
          EP Investing ("we", "our", "us") respects your privacy and is committed
          to protecting your personal data. This Privacy Policy explains how we
          collect, use, and safeguard your information when you use our platform.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            1. Information We Collect
          </h2>
          <p>
            We may collect personal information that you voluntarily provide,
            including:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Name and contact details (email, phone)</li>
            <li>Professional information (company, role, industry)</li>
            <li>Investment preferences and interests</li>
            <li>Account credentials</li>
            <li>Any information submitted via forms</li>
          </ul>
          <p className="mt-2">
            We also collect non-personal data such as browser type, IP address,
            and usage analytics.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            2. How We Use Your Information
          </h2>
          <p>Your data is used to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide and improve our services</li>
            <li>Match investors, founders, and opportunities</li>
            <li>Send updates, newsletters, and communications</li>
            <li>Respond to inquiries and support requests</li>
            <li>Ensure platform security and prevent fraud</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            3. Sharing of Information
          </h2>
          <p>
            We do not sell your personal data. We may share information with:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Service providers and partners</li>
            <li>Legal authorities when required</li>
            <li>Other users (only with your consent for matching purposes)</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            4. Data Security
          </h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your data from unauthorized access, misuse, or disclosure.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            5. Cookies and Tracking
          </h2>
          <p>
            We use cookies and similar technologies to enhance your experience,
            analyze traffic, and improve functionality. You can control cookie
            settings through your browser.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            6. Your Rights
          </h2>
          <p>You may have the right to:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Access your data</li>
            <li>Request corrections or deletion</li>
            <li>Withdraw consent</li>
            <li>Opt-out of marketing communications</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            7. Third-Party Links
          </h2>
          <p>
            Our platform may contain links to external websites. We are not
            responsible for their privacy practices.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            8. Changes to This Policy
          </h2>
          <p>
            We may update this policy from time to time. Changes will be posted on
            this page with an updated date.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            9. Contact Us
          </h2>
          <p>
            If you have any questions, please contact us at:
            <br />
            <span className="font-medium">support@epinvesting.com</span>
          </p>
        </div>
      </section>
    </div>
  );
}