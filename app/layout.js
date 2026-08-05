import { Lato, Geist_Mono, Montserrat } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { PHProvider } from "./providers";
import { PaywallProvider } from "@/components/PaywallModal";

// Body font — Lato, matching The Energy Pioneer. Variable name kept as
// --font-geist-sans so every existing usage picks up the new font unchanged.
const geistSans = Lato({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headline / display font — Montserrat, matching The Energy Pioneer post titles.
const robotoCondensed = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata = {
  title: "EP Investing — Climate & Energy Intelligence",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  description: "Discover 1,300+ climate and energy companies, 350+ investors, and 185+ grants across the energy transition.",
  metadataBase: new URL("https://epinvesting.com"),
  openGraph: {
    title: "EP Investing — Climate & Energy Intelligence",
    description: "Discover climate and energy companies, investors, and grants across the energy transition.",
    url: "https://epinvesting.com",
    siteName: "EP Investing",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "EP Investing" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "EP Investing — Climate & Energy Intelligence",
    description: "Discover climate and energy companies, investors, and grants across the energy transition.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
    signUpUrl="/sign-up"
    signInUrl="/sign-in"
    appearance={{
    layout: {
      logoImageUrl: "/favicon.svg",
      logoLinkUrl: "/",
      showOptionalFields: false,
    },
        variables: {
          colorPrimary: "#2d6a4f",
          colorBackground: "#f6f7f9",
          colorInputBackground: "#ffffff",
          colorInputText: "#0f1a14",
          colorText: "#0f1a14",
          colorTextSecondary: "#4a5568",
          borderRadius: "0.75rem",
          fontFamily: "var(--font-geist-sans), sans-serif",
        },
        elements: {
          logoImage: {
            height: "48px",
            width: "auto",
          },

          formButtonPrimary: {
            backgroundColor: "#2d6a4f",
          },
          card: {
            boxShadow: "none",
            border: "1px solid #e8eaee",
          },
          headerTitle: {
            fontFamily: "var(--font-display), sans-serif",
            fontSize: "24px",
            color: "#0f1a14",
          },
          headerSubtitle: {
            color: "#4a5568",
          },
          footerActionLink: {
            color: "#2d6a4f",
          },
        },
      }}
      localization={{
        signUp: {
          start: {
            title: "Create your account",
            subtitle: "Join EP Investing to manage your profile",
          },
        },
      }}
    >
      <html lang="en">
        <body className={`${geistSans.variable} ${geistMono.variable} ${robotoCondensed.variable}`}>
          <PHProvider>
            <PaywallProvider>
              <Navbar />
              {children}
              <Toaster position="top-right" />
            </PaywallProvider>
          </PHProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}