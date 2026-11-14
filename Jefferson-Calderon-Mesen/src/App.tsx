import { useState } from "react";
import { connectWallet, disconnectWallet } from "./wallet";
import "./App.css";

// Convierte "GABCD...muy larga...WXYZ" en "GABC…WXYZ"
function abreviar(direccion: string) {
  return `${direccion.slice(0, 4)}…${direccion.slice(-4)}`;
}

function App() {
  // La dirección de la wallet conectada (null = no hay ninguna conectada)
  const [address, setAddress] = useState<string | null>(null);
  // true mientras esperamos que el usuario elija su wallet
  const [cargando, setCargando] = useState(false);
  // Mensaje de error para mostrar en pantalla
  const [error, setError] = useState<string | null>(null);

  async function handleConectar() {
    setCargando(true);
    setError(null);
    try {
      const direccion = await connectWallet();
      setAddress(direccion);
    } catch {
      // Pasa si el usuario cierra la ventana o rechaza la conexión
      setError("No se pudo conectar la wallet. ¿Cerraste la ventana o Freighter está bloqueado?");
    } finally {
      setCargando(false);
    }
  }

  async function handleDesconectar() {
    await disconnectWallet();
    setAddress(null);
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