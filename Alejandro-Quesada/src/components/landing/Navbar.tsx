"use client";

import { useState } from "react";

const NAV_LINKS = [
  { label: "Inicio", href: "#inicio" },
  { label: "Nosotros", href: "#nosotros" },
  { label: "Blog", href: "#blog" },
  { label: "Servicios", href: "#servicios" },
  { label: "Soporte", href: "#soporte" },
  { label: "Contacto", href: "#contacto" },
];

interface NavbarProps {
  onConnect: () => void;
  isConnected: boolean;
  truncatedKey: string | null;
  isConnecting: boolean;
}

export default function Navbar({ onConnect, isConnected, truncatedKey, isConnecting }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-bg/90 backdrop-blur-md border-b border-border">
      <div className="section-container h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <a href="#" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center font-bold text-white text-xs">
            K
          </div>
          <span className="text-white font-semibold text-base tracking-tight">Koired</span>
        </a>

        {/* Links escritorio */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-muted hover:text-white transition-colors"
            >
              {label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isConnected ? (
            <button
              onClick={onConnect}
              className="hidden md:flex items-center gap-2 text-sm font-mono bg-accent/10 border border-accent/30 text-accent px-4 py-2 rounded-full hover:bg-accent/20 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {truncatedKey}
            </button>
          ) : (
            <button
              onClick={onConnect}
              disabled={isConnecting}
              className="btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {isConnecting ? "Conectando…" : "Conectar Wallet"}
            </button>
          )}

          <button
            className="lg:hidden text-muted p-1"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="lg:hidden border-t border-border bg-card px-6 py-4 flex flex-col gap-3">
          {NAV_LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="text-sm text-muted hover:text-white transition-colors py-1"
              onClick={() => setMenuOpen(false)}
            >
              {label}
            </a>
          ))}
          {!isConnected && (
            <button onClick={onConnect} className="btn-primary text-sm py-2.5 mt-2">
              Conectar Wallet
            </button>
          )}
        </div>
      )}
    </nav>
  );
}
