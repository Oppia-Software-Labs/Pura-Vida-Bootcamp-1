import Link from "next/link";
import { Icon } from "./Icon";

export const TESTNET_DOCS = "https://developers.stellar.org/docs/networks";

export function TestnetBanner() {
  return <div className="testnet-banner"><Icon name="warning" width="17" height="17"/><span><strong>MODO PRUEBA:</strong> estás en Testnet. Aquí no hay dinero real.</span></div>;
}

export function TestnetBadge() {
  return <span className="testnet-badge"><span aria-hidden="true" />TESTNET</span>;
}

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-shell header-inner">
        <Link href="/" className="brand" aria-label="Baula Stellar, inicio">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/baula.svg" alt="" width="34" height="34"/><span>Baula<span>Stellar</span></span>
        </Link>
        <nav aria-label="Navegación principal">
          <Link href="/viaje">El viaje</Link>
          <Link href="/viaje?nivel=1#glosario">Glosario</Link>
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell footer-inner">
        <span>Baula Stellar · Pura Vida Bootcamp</span>
        <a href={TESTNET_DOCS} rel="noreferrer" target="_blank">
          Solo Testnet, sin dinero real <Icon name="external" width="15" height="15"/>
        </a>
      </div>
    </footer>
  );
}
