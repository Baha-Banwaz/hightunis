import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SITE_URL, SITE_CONFIG } from "@/lib/site-config";
import { OG_DEFAULTS, TWITTER_DEFAULTS } from "@/lib/og";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  // The weights the site actually uses. 400 is the default for body copy with
  // no weight class, 500/700/900 are used throughout, and 600 is used by the
  // admin. 800 was requested and referenced nowhere.
  weight: ["400", "500", "600", "700", "900"],
  // Fall back to the system stack while the webfont loads, then swap, rather
  // than holding text invisible.
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_CONFIG.name} | ${SITE_CONFIG.tagline}`,
    template: `%s | ${SITE_CONFIG.name}`,
  },
  description: SITE_CONFIG.description,
  // "./" resolves against metadataBase AND the current route, so one line
  // gives every page its own canonical, including dynamic ones. A bare "/"
  // would make every page claim the homepage.
  alternates: { canonical: "./" },
  // app/favicon.ico is picked up by convention. These are the surfaces that
  // convention does not cover: the iOS home screen, the Android launcher and
  // the SVG some browsers prefer for the tab.
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icons/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    ...OG_DEFAULTS,
    url: "./",
  },
  twitter: TWITTER_DEFAULTS,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      {/* suppressHydrationWarning: browser extensions inject attributes into <body> before React hydrates */}
      <body
        suppressHydrationWarning
        className={`${dmSans.variable} font-sans min-h-screen flex flex-col antialiased bg-white text-rich-black`}
      >
        {children}
      </body>
    </html>
  );
}
