import { WalletSection } from "./components/WalletSection.jsx";

function App() {
  return (
    <div className="page">
      <header className="topbar">
        <div className="topbar__brand">
          <span className="brand-mark" aria-hidden="true">
            ✦
          </span>
          <div>
            <h1 className="topbar__title">Stellar Testnet dApp</h1>
            <p className="topbar__subtitle">
              Pura Vida Bootcamp · Interfaz base
            </p>
          </div>
        </div>
        <span className="env-pill">Testnet</span>
      </header>

      <main className="main-content">
        <WalletSection />
      </main>

      <footer className="footer">
        <span>
          Preparado para <code>@stellar/stellar-sdk</code> y{" "}
          <code>@stellar/varial-sdk</code>
        </span>
      </footer>
    </div>
  );
}

export default App;
