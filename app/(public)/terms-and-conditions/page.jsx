// app/terms-and-conditions/page.jsx

export const metadata = {
  title: "Terms & Conditions | EP Investing",
  description:
    "Read the terms and conditions governing the use of EP Investing platform and services.",
};

export default function TermsAndConditions() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-32 text-gray-700">
      <h1 className="text-4xl font-bold mb-6 text-black">
        Terms & Conditions
      </h1>
      <p className="mb-6 text-sm text-gray-500">Last updated: February 2026</p>

      <section className="space-y-6">
        <p>
          By accessing or using EP Investing, you agree to comply with and be
          bound by these Terms and Conditions. If you do not agree, please do not
          use our platform.
        </p>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            1. Use of the Platform
          </h2>
          <p>
            You agree to use the platform only for lawful purposes. You must not:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Provide false or misleading information</li>
            <li>Attempt unauthorized access</li>
            <li>Disrupt or damage the platform</li>
            <li>Use the service for illegal activities</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            2. User Accounts
          </h2>
          <p>
            You are responsible for maintaining the confidentiality of your
            account credentials and for all activities under your account.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            3. Matching and Listings
          </h2>
          <p>
            EP Investing provides information and matching services between
            investors, founders, and opportunities. We do not guarantee:
          </p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Investment outcomes</li>
            <li>Accuracy of third-party data</li>
            <li>Successful partnerships or funding</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            4. Intellectual Property
          </h2>
          <p>
            All content, branding, and materials on this platform are the
            intellectual property of EP Investing and may not be used without
            permission.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            5. Limitation of Liability
          </h2>
          <p>
            We are not liable for any direct, indirect, or incidental damages
            resulting from the use of our platform.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            6. Termination
          </h2>
          <p>
            We reserve the right to suspend or terminate accounts that violate
            these terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            7. Third-Party Services
          </h2>
          <p>
            The platform may include third-party tools or links. We are not
            responsible for their content or services.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            8. Changes to Terms
          </h2>
          <p>
            We may update these terms at any time. Continued use of the platform
            constitutes acceptance of the revised terms.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            9. Governing Law
          </h2>
          <p>
            These terms shall be governed by and interpreted in accordance with
            applicable laws of the jurisdiction in which the company operates.
          </p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2 text-black">
            10. Contact Us
          </h2>
          <p>
            For any questions regarding these Terms:
            <br />
            <span className="font-medium">support@epinvesting.com</span>
          </p>
        </div>
      </section>
    </div>
  );
}