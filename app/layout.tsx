import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import { SITE_URL, SITE_CONFIG } from "@/lib/site-config";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
  openGraph: {
    siteName: SITE_CONFIG.name,
    type: "website",
    url: "./",
  },
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
