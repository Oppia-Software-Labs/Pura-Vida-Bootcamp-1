// Router mínimo basado en el hash de la URL (#/ruta).
import { useEffect, useState } from "react";

export type Route = { path: string[]; query: URLSearchParams };

function parse(hash: string): Route {
  const raw = hash.replace(/^#/, "") || "/";
  const [p, q] = raw.split("?");
  return { path: p.split("/").filter(Boolean), query: new URLSearchParams(q ?? "") };
}

export function useRoute(): Route {
  const [hash, setHash] = useState(window.location.hash);
  useEffect(() => {
    const f = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return parse(hash);
}

export function navigate(to: string) {
  window.location.hash = to;
}

// ---------- Links de cobro ----------

export type PayLink = {
  to: string; // dirección Stellar de quien cobra
  toName: string;
  fromName: string;
  amount: number;
  currency: string;
  memo: string;
  description: string;
};

function b64urlEncode(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecode(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function buildPayLink(p: PayLink): string {
  const data = b64urlEncode(JSON.stringify(p));
  return `${window.location.origin}${window.location.pathname}#/pagar/${data}`;
}

export function readPayLink(data: string): PayLink | null {
  try {
    const p = JSON.parse(b64urlDecode(data)) as PayLink;
    return p.to && p.memo && p.amount > 0 ? p : null;
  } catch {
    return null;
  }
}
