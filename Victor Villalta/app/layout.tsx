import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { JourneyProvider } from "@/components/JourneyProvider";
import { RavenProvider } from "@/components/RavenPanel";
import { SiteFooter, SiteHeader, TestnetBanner } from "@/components/SiteChrome";
import "./globals.css";

const displayFont = localFont({
  src: "../node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-fraunces",
  display: "swap",
});

const textFont = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Baula Stellar", template: "%s · Baula Stellar" },
  description: "Aprendé Stellar desde cero. Conectá tu wallet y hacé tu primer pago de prueba en Testnet.",
  icons: { icon: "/baula.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-CR" className={`${displayFont.variable} ${textFont.variable}`}>
      <body>
        <a className="skip-link" href="#contenido">Saltar al contenido</a>
        <TestnetBanner/>
        <SiteHeader/>
        <JourneyProvider><RavenProvider>{children}</RavenProvider></JourneyProvider>
        <SiteFooter/>
      </body>
    </html>
  );
}
