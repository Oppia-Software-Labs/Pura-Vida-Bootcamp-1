import { useEffect, useState } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import { getBalance, fundWithFriendbot } from "./stellar";
import "./App.css";

// Convierte "GABCD...muy larga...WXYZ" en "GABC…WXYZ"
function abreviar(direccion: string) {
  return `${direccion.slice(0, 4)}…${direccion.slice(-4)}`;
}

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // undefined = todavía no sabemos | null = cuenta no fondeada | "123.45" = saldo
  const [saldo, setSaldo] = useState<string | null | undefined>(undefined);
  const [fondeando, setFondeando] = useState(false);

  // Pide el saldo a Horizon y lo guarda en pantalla
  async function cargarSaldo(direccion: string) {
    try {
      setSaldo(await getBalance(direccion));
    } catch {
      setError("No se pudo leer el saldo. Revisa tu conexión a internet.");
    }
  }

  // Cada vez que cambia la dirección (al conectar), cargamos el saldo
  useEffect(() => {
    if (address) cargarSaldo(address);
  }, [address]);

  async function handleConectar() {
    setCargando(true);
    setError(null);
    try {
      const direccion = await connectWallet();
      setAddress(direccion);
    } catch {
      setError("No se pudo conectar la wallet. ¿Cerraste la ventana o Freighter está bloqueado?");
    } finally {
      setCargando(false);
    }
  }

  async function handleDesconectar() {
    await disconnectWallet();
    setAddress(null);
    setSaldo(undefined);
    setError(null);
  }

  async function handleFriendbot() {
    if (!address) return;
    setFondeando(true);
    setError(null);
    try {
      await fundWithFriendbot(address);
      await cargarSaldo(address); // Volvemos a leer el saldo ya fondeado
    } catch {
      setError("Friendbot falló. Espera un momento y prueba otra vez.");
    } finally {
      setFondeando(false);
    }
  }

  return (
    <main>
      <h1>Pura Vida Tips 🌴</h1>
      <p>Dejale una propina en XLM a tu creador favorito (red de prueba Testnet).</p>

      {address ? (
        <div>
          <p>
            Conectado como <strong title={address}>{abreviar(address)}</strong>
          </p>

          {saldo === undefined && <p>Cargando saldo...</p>}

          {saldo === null && (
            <div>
              <p>Tu cuenta todavía no existe en Testnet. Fondeala gratis con Friendbot:</p>
              <button onClick={handleFriendbot} disabled={fondeando}>
                {fondeando ? "Fondeando..." : "Fondear con Friendbot"}
              </button>
            </div>
          )}

          {typeof saldo === "string" && (
            <p>
              Saldo: <strong>{Number(saldo).toFixed(2)} XLM</strong>{" "}
              <button onClick={() => cargarSaldo(address)}>Actualizar</button>
            </p>
          )}

          <button onClick={handleDesconectar}>Desconectar</button>
        </div>
      ) : (
        <button onClick={handleConectar} disabled={cargando}>
          {cargando ? "Conectando..." : "Conectar wallet"}
        </button>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}

export default App;