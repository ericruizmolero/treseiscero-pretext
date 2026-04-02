import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import { LenisProvider } from "@/lib/lenis";
import "@/styles/globals.css";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "treseiscero — Pixel Boutique",
  description:
    "We don't bind ourselves to any single tool or technology. We follow quality, wherever it leads. We're a pixel boutique.",
  openGraph: {
    title: "treseiscero — Pixel Boutique",
    description: "Small by design, obsessive about craft.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={spaceMono.variable} suppressHydrationWarning>
      <head>
        {/* Satoshi via Fontshare — swap for self-hosted in production */}
        <link rel="preconnect" href="https://api.fontshare.com" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap"
        />
      </head>
      <body suppressHydrationWarning>
        <LenisProvider>{children}</LenisProvider>
      </body>
    </html>
  );
}
