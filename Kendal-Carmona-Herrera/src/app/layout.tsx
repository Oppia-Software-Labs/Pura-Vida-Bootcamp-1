import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarView — Stellar Testnet dashboard",
  description:
    "Connect a Stellar wallet, inspect your Testnet account and send XLM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
