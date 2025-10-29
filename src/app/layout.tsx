import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DROPIQ - Your Intelligent Command Center for Crypto Airdrop Farming",
  description: "Navigate the high-risk, high-reward world of airdrops with confidence. We turn frantic searching into strategic, data-driven decisions through our vetted discovery platform and advanced security analysis.",
  keywords: ["DROPIQ", "airdrop", "cryptocurrency", "blockchain", "DeFi", "crypto farming"],
  authors: [{ name: "DROPIQ Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DROPIQ - Airdrop Discovery Platform",
    description: "AI-powered airdrop discovery and vetting platform",
    url: "https://dropiq.com",
    siteName: "DROPIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DROPIQ - Airdrop Discovery Platform",
    description: "AI-powered airdrop discovery and vetting platform",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
