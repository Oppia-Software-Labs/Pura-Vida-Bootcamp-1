import { createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { fetchBalance, lookupNetwork } from "./horizon.js";

function WalletPanel() {
  const [account, setAccount] = useState(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [showInstall, setShowInstall] = useState(false);

  async function syncWallet() {
    const wallet = window.freighterApi;
    setBusy(true);
    setStatus("Consultando la wallet…");
    setShowInstall(false);
    setAccount(previous => previous && { ...previous, balance: "—" });

    try {
      if (!wallet) throw new Error("No se pudo cargar el SDK de la wallet. Recarga la página.");

      const availability = await wallet.isConnected();
      if (!availability.isConnected) {
        setShowInstall(true);
        throw new Error("Activa la extensión de Varial / Freighter en este navegador.");
      }

      const result = await wallet.requestAccess();
      if (result.error || !/^G[A-Z2-7]{55}$/.test(result.address ?? "")) {
        throw new Error("No se recibió una dirección pública. Desbloquea la wallet y autoriza el acceso.");
      }

      const connected = { address: result.address, network: "Sin identificar", balance: "—" };
      setAccount(connected);

      try {
        const selected = await wallet.getNetwork();
        const horizon = lookupNetwork(selected.network);
        const current = { ...connected, network: horizon?.label ?? (selected.network || "Sin identificar") };
        setAccount(current);

        if (selected.error || !horizon) {
          setStatus("El saldo está disponible en Mainnet y Testnet. Cambia la red en tu wallet y pulsa Actualizar.");
          return;
        }

        const amount = await fetchBalance(horizon.endpoint, current.address);
        setAccount({ ...current, balance: amount === null ? "—" : `${amount} XLM` });
        setStatus(amount === null ? "Esta cuenta aún no existe en la red seleccionada." : "");
      } catch {
        setStatus("No se pudo consultar la cuenta. Pulsa Actualizar para volver a intentarlo.");
      }
    } catch (error) {
      setAccount(null);
      setStatus(error instanceof Error ? error.message : "No se pudo conectar la wallet.");
    } finally {
      setBusy(false);
    }
  }

  async function disconnectWallet() {
    setBusy(true);
    try {
      const result = await window.freighterApi.disconnect();
      if (result?.error) throw new Error(result.error.message);
      setAccount(null);
      setStatus("Wallet desconectada.");
    } catch {
      setStatus("No se pudo desconectar. Puedes revocar el acceso desde la extensión.");
    } finally {
      setBusy(false);
    }
  }

  return h("section", { "aria-labelledby": "wallet-title" },
    h("h2", { id: "wallet-title" }, "Wallet Stellar"),
    h("p", { className: "provider" }, "Varial / Freighter"),
    account && h("dl", { id: "account" },
      h("dt", null, "Red"), h("dd", { id: "network" }, account.network),
      h("dt", null, "Dirección pública"), h("dd", { id: "address", className: "address" }, account.address),
      h("dt", null, "Saldo"), h("dd", { id: "balance", className: "balance" }, account.balance),
    ),
    h("div", { className: "actions" },
      account
        ? h("button", { id: "refresh", type: "button", disabled: busy, onClick: syncWallet }, "Actualizar")
        : h("button", { id: "connect", type: "button", disabled: busy, onClick: syncWallet }, "Conectar wallet"),
      account && h("button", {
        id: "disconnect", type: "button", disabled: busy, onClick: disconnectWallet,
      }, "Desconectar"),
    ),
    h("p", { id: "status", role: "status" }, status),
    showInstall && h("a", { href: "https://www.freighter.app/" }, "Obtener la extensión"),
  );
}

function App() {
  return h("main", null,
    h("header", null,
      h("span", { className: "brand" }, "◉ Órbita Stellar"),
      h("span", { className: "mode" }, "Solo lectura"),
    ),
    h("h1", null, "Tu cuenta en Stellar"),
    h("p", { className: "intro" }, "Conecta tu wallet para consultar tu dirección pública y el saldo de lumens (XLM)."),
    h(WalletPanel),
  );
}

createRoot(document.getElementById("root")).render(h(App));
