import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { PHProvider } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EP Investing — Climate & Energy Intelligence",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  description: "Discover 1,300+ climate and energy companies, 350+ investors, and 59 grants across the energy transition.",
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
  }

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        {/* overflow-x-hidden prevents any rogue element from causing horizontal scroll */}
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#f2f4f8] overflow-x-hidden`}>
          <Navbar />
          {children}
          <Toaster position="top-center" reverseOrder={false} />
        </body>
      </html>
    <PHProvider></PHProvider>
    <ClerkProvider
  appearance={{
    variables: {
      colorPrimary: "#2d6a4f",
      colorBackground: "#f2f4f8",
      colorInputBackground: "#ffffff",
      colorInputText: "#0f1a14",
      colorText: "#0f1a14",
      colorTextSecondary: "#4a5568",
      borderRadius: "0.75rem",
      fontFamily: "var(--font-geist-sans), sans-serif",
    },
    elements: {
      formButtonPrimary: {
        backgroundColor: "#2d6a4f",
        "&:hover": { backgroundColor: "#235a40" },
      },
      card: {
        boxShadow: "none",
        border: "1px solid #e2e6ed",
      },
      headerTitle: {
        fontFamily: "Georgia, serif",
        fontSize: "24px",
        color: "#0f1a14",
      },
      headerSubtitle: {
        color: "#4a5568",
      },
      socialButtonsBlockButton: {
        border: "1px solid #e2e6ed",
        color: "#0f1a14",
      },
      footerActionLink: {
        color: "#2d6a4f",
      },
      identityPreviewEditButton: {
        color: "#2d6a4f",
      },
    },
    layout: {
      logoPlacement: "inside",
      showOptionalFields: false,
    },
 }}
>
      <PHProvider>
        <Navbar />
        {children}
        <Toaster position="top-right" />
      </PHProvider>
    </ClerkProvider>
  );
}
