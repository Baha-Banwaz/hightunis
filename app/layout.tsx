import type { Metadata } from "next";
import { Bodoni_Moda, DM_Sans } from "next/font/google";
import "./globals.css";

const bodoniModa = Bodoni_Moda({
  variable: "--font-bodoni-moda",
  subsets: ["latin"],
  weight: "900",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "High Tunis | Tunisia's Luxury",
  description: "Luxury stays, curated experiences, unforgettable moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${bodoniModa.variable} ${dmSans.variable} font-sans min-h-screen flex flex-col antialiased bg-white text-rich-black`}>
        {children}
      </body>
    </html>
  );
}
