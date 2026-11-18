import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarView — Stellar Testnet dashboard",
  description:
    "Connect a Stellar wallet, inspect your Testnet account and send XLM.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Browser extensions (LanguageTool, Grammarly, wallets) stamp attributes on
    // <html> before React hydrates. This only silences attribute mismatches on this
    // one element; mismatches inside the tree are still reported.
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
