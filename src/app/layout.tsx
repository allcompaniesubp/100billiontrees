import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://200billiontrees.unspuniversity.com"),
  title: "200 Billion Trees | A Global Green Movement",
  description:
    "Join a global movement to plant, protect and monitor trees and restore ecosystems across countries and communities.",
  applicationName: "200 Billion Trees",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    title: "200 Billion Trees — One Planet, One Green Future",
    description: "Plant responsibly. Protect biodiversity. Grow a greener future together.",
    type: "website",
    url: "https://200billiontrees.unspuniversity.com/",
    siteName: "200 Billion Trees",
  },
  twitter: {
    card: "summary_large_image",
    title: "200 Billion Trees | A Global Green Movement",
    description: "Plant responsibly. Protect biodiversity. Grow a greener future together.",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
