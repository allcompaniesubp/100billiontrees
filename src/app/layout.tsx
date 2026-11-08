import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "200 Billion Trees | A Global Green Movement",
  description:
    "Join a global movement to plant, protect and monitor trees and restore ecosystems across countries and communities.",
  applicationName: "200 Billion Trees",
  openGraph: {
    title: "200 Billion Trees — One Planet, One Green Future",
    description: "Plant responsibly. Protect biodiversity. Grow a greener future together.",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
