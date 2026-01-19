import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
  ),
  title: {
    default: "ND Class B Basketball Schools | 1972-2012 Timeline",
    template: "%s | ND Class B",
  },
  description:
    "Explore the history of North Dakota Class B high school basketball from 1972 to 2012. Interactive map and timeline showing school consolidations, co-ops, and district changes across the state.",
  keywords: [
    "North Dakota",
    "Class B",
    "high school basketball",
    "NDHSAA",
    "school consolidation",
    "co-ops",
    "cooperative teams",
    "timeline",
    "history",
    "districts",
  ],
  authors: [{ name: "ND Class B Project" }],
  creator: "ND Class B Project",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "ND Class B",
    title: "ND Class B Basketball Schools | 1972-2012 Timeline",
    description:
      "Interactive map and timeline exploring 40 years of North Dakota Class B high school basketball history, school consolidations, and co-ops.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ND Class B Basketball Schools Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ND Class B Basketball Schools | 1972-2012",
    description:
      "Explore 40 years of North Dakota Class B high school basketball history with an interactive map and timeline.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
