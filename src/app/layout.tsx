import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { Navigation } from "@/components/layout/navigation";
import { ConditionalNavigation } from "@/components/layout/conditional-navigation";
import { clientConfig } from '@/sentry.client.config';
import * as Sentry from '@sentry/nextjs';

// Initialize Sentry
Sentry.init(clientConfig);

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DropIQ - Smart Airdrop Aggregation Platform",
  description: "Discover, track, and participate in the most valuable cryptocurrency airdrops with AI-powered insights and risk assessment.",
  keywords: ["DropIQ", "airdrop", "cryptocurrency", "blockchain", "DeFi", "crypto", "token distribution", "airdrop aggregator"],
  authors: [{ name: "DropIQ Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "DropIQ - Smart Airdrop Aggregation",
    description: "AI-powered platform for discovering and tracking valuable cryptocurrency airdrops",
    url: "https://dropiq.com",
    siteName: "DropIQ",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "DropIQ - Smart Airdrop Aggregation",
    description: "AI-powered platform for discovering and tracking valuable cryptocurrency airdrops",
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
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryClientProvider>
            <AuthProvider>
              <ConditionalNavigation />
              {children}
              <Toaster />
            </AuthProvider>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
