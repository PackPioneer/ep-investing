import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// import Navbar from "@/components/Navbar";
// import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "EP Investing",
  description: "By Websidezone",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
<html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* <Navbar /> */}
        {children}
        <Toaster
  position="top-center"
  reverseOrder={false}
/>
        {/* <Footer /> */}
      </body>
    </html>
    </ClerkProvider>
    
  );
}
