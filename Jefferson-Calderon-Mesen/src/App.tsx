import { useEffect, useRef, useState } from "react";
import { connectWallet, disconnectWallet, signTip } from "./wallet";
import {
  getBalance,
  fundWithFriendbot,
  buildTipTransaction,
  submitSignedTransaction,
  explorerTxUrl,
  CREATOR_ADDRESS,
} from "./stellar";
import { mensajeDeError } from "./errores";
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

    // Monto que se está enviando ("1", "5", "10") o null si no se está enviando nada
    const [enviando, setEnviando] = useState<string | null>(null);
    // Hash de la última propina enviada con éxito
    const [txHash, setTxHash] = useState<string | null>(null);
    // "Candado" contra el doble clic
    const enviandoRef = useRef(false);

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
    setTxHash(null);
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
  async function handlePropina(monto: string) {
    if (!address || enviandoRef.current) return; // ya hay un envío en curso
    if (address === CREATOR_ADDRESS) {
      setError("Estás conectado con la cuenta del creador. Cambia de cuenta en Freighter.");
      return;
    }

    enviandoRef.current = true;
    setEnviando(monto);
    setError(null);
    setTxHash(null);
    try {
      const xdr = await buildTipTransaction(address, monto); // 1. armar
      const firmada = await signTip(xdr, address);           // 2. firmar (se abre Freighter)
      const hash = await submitSignedTransaction(firmada);   // 3. enviar a la red
      setTxHash(hash);
      await cargarSaldo(address);                            // 4. saldo nuevo
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      enviandoRef.current = false;
      setEnviando(null);
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
            <>
              <p>
                Saldo: <strong>{Number(saldo).toFixed(2)} XLM</strong>{" "}
                <button onClick={() => cargarSaldo(address)}>Actualizar</button>
              </p>

              <section>
                <h2>Enviar propina</h2>
                <p>
                  Para: <strong title={CREATOR_ADDRESS}>{abreviar(CREATOR_ADDRESS)}</strong>
                </p>
                {["1", "5", "10"].map((monto) => (
                  <button
                    key={monto}
                    onClick={() => handlePropina(monto)}
                    disabled={enviando !== null}
                  >
                    {enviando === monto ? "Firmando y enviando..." : `${monto} XLM`}
                  </button>
                ))}
              </section>

              {txHash && (
                <div>
                  <p>¡Gracias, pura vida! 🌴</p>
                  <a href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
                    Ver transacción en el explorador
                  </a>
                </div>
              )}
            </>
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