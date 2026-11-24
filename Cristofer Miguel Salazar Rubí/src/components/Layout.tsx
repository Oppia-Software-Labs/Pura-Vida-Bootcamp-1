import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useFolio } from "../folio-context";
import { STELLAR } from "../lib/stellar";
import { AlertIcon, CloseIcon, FolioMark, MenuIcon } from "./Icons";
import { WalletButton } from "./WalletButton";

const NAV = [
  { to: "/", label: "Explorar", end: true },
  { to: "/biblioteca", label: "Mi biblioteca" },
  { to: "/publicar", label: "Publicar" },
];

const CURRENT_YEAR = new Date().getFullYear();

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export function Layout() {
  const { wallet } = useFolio();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (location.pathname.startsWith("/leer/")) {
    return (
      <>
        <ScrollToTop />
        <Outlet />
      </>
    );
  }

  return (
    <div className="app-shell">
      <ScrollToTop />

      <header className="site-header">
        <div className="site-header__inner">
          <Link className="brand" to="/" aria-label="Folio, inicio">
            <span className="brand__mark">
              <FolioMark size={36} />
            </span>
            <span className="brand__name">
              Folio<sup>°</sup>
            </span>
          </Link>

          <nav className={`site-nav ${menuOpen ? "site-nav--open" : ""}`}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `site-nav__link ${isActive ? "is-active" : ""}`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="site-nav__mobile-wallet">
              <WalletButton />
            </div>
          </nav>

          <div className="site-header__actions">
            <span className="network-badge">
              <span className="network-badge__dot" />
              Testnet
            </span>
            <WalletButton />
          </div>

          <button
            className="site-header__menu"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <CloseIcon size={22} /> : <MenuIcon size={22} />}
          </button>
        </div>

        {wallet.error && (
          <div className="global-alert" role="alert">
            <AlertIcon size={16} />
            {wallet.error}
          </div>
        )}
      </header>

      <main className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="footer-brand">
            <FolioMark size={30} />
            <div>
              <strong>Folio</strong>
              <span>Libros que circulan. Historias que se quedan.</span>
            </div>
          </div>

          <div className="footer-links">
            <Link to="/">Explorar</Link>
            <Link to="/publicar">Publicar un libro</Link>
            <a href={STELLAR.explorerUrl} target="_blank" rel="noreferrer">
              Stellar Expert
            </a>
          </div>

          <div className="footer-meta">
            <span className="network-badge">
              <span className="network-badge__dot" />
              Stellar Testnet
            </span>
            <span>© {CURRENT_YEAR} Folio</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
