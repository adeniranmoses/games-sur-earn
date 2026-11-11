import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

// Inter is widely cached by Next.js and has excellent fallbacks.
// Geist requires a network call that fails in some environments.
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RewardPlatform – Earn Rewards by Completing Offers",
  description:
    "Earn rewards by completing app installs, surveys, games and sponsored tasks. Withdraw to your bank account.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#F5F7FA] text-[#102A43] antialiased">
        {process.env.NEXT_PUBLIC_MONETAG_ZONE_ID && (
          <Script
            src="https://alwingulla.com/88/tag.min.js"
            data-zone={process.env.NEXT_PUBLIC_MONETAG_ZONE_ID}
            strategy="afterInteractive"
          />
        )}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
