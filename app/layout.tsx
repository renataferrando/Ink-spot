import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { JetBrains_Mono } from "next/font/google";

import "./globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s · InkSpot",
    default: "InkSpot — Find tattoo artists worldwide",
  },
  description: "Discover verified studios, styles, and locations for your next tattoo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable} ${jetbrainsMono.variable} h-full scroll-smooth`}
    >
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
