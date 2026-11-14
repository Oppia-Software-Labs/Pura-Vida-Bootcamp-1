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

// Muestra el saldo al estilo de Costa Rica: "9 995,00"
function formatearSaldo(saldo: string) {
  return Number(saldo).toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

const MONTOS = ["1", "5", "10"];

function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // undefined = todavía no sabemos | null = cuenta no fondeada | "123.45" = saldo
  const [saldo, setSaldo] = useState<string | null | undefined>(undefined);
  const [fondeando, setFondeando] = useState(false);

  // Monto que se está enviando ("1", "5", "10") o null si no se está enviando nada
  const [enviando, setEnviando] = useState<string | null>(null);
  // Hash y monto de la última propina enviada con éxito
  const [txHash, setTxHash] = useState<string | null>(null);
  const [ultimoMonto, setUltimoMonto] = useState<string | null>(null);
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
      setUltimoMonto(monto); // para que esa rueda dé su vuelta de celebración
      setTxHash(hash);
      await cargarSaldo(address);                            // 4. saldo nuevo
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      enviandoRef.current = false;
      setEnviando(null);
    }
  }

  // Las ruedas solo se pueden tocar con la wallet conectada, con saldo y sin otro envío en curso
  const puedePropinar = address !== null && typeof saldo === "string" && enviando === null;

  return (
    <main className="panel">
      <header>
        {/*   = espacio que no se corta: la palmera nunca queda sola en otra línea */}
        <h1 className="titulo">Pura Vida Tips{" "}🌴</h1>
        <p className="intro">Dejale una propina en XLM a tu creador favorito.</p>
      </header>

      {address ? (
        <section className="cuenta" aria-label="Tu cuenta">
          <div>
            <p>
              Conectado como{" "}
              <span className="cuenta-direccion" title={address}>
                {abreviar(address)}
              </span>
            </p>
            {saldo === undefined && <p>Cargando saldo...</p>}
            {typeof saldo === "string" && (
              <p className="cuenta-saldo">{formatearSaldo(saldo)} XLM</p>
            )}
          </div>

          <div className="cuenta-acciones">
            {typeof saldo === "string" && (
              <button className="boton-suave" onClick={() => cargarSaldo(address)}>
                Actualizar
              </button>
            )}
            <button className="boton-suave" onClick={handleDesconectar}>
              Desconectar
            </button>
          </div>

          {saldo === null && (
            <div className="fondear">
              <p>Tu cuenta todavía no existe en Testnet. Fondeala gratis con Friendbot:</p>
              <button className="boton-principal" onClick={handleFriendbot} disabled={fondeando}>
                {fondeando ? "Fondeando..." : "Fondear con Friendbot"}
              </button>
            </div>
          )}
        </section>
      ) : (
        <button className="boton-principal" onClick={handleConectar} disabled={cargando}>
          {cargando ? "Conectando..." : "Conectar wallet"}
        </button>
      )}

      <section className="propinas" aria-label="Enviar propina">
        <h2 className="propinas-titulo">Elige tu propina</h2>

        <div className={`ruedas${enviando !== null ? " ocupadas" : ""}`}>
          {MONTOS.map((monto) => {
            const girando = enviando === monto;
            const lista = !girando && txHash !== null && ultimoMonto === monto;
            return (
              <button
                key={monto}
                className={`rueda${girando ? " girando" : ""}${lista ? " lista" : ""}`}
                onClick={() => handlePropina(monto)}
                disabled={!puedePropinar}
              >
                <span className="rueda-dibujo" aria-hidden="true">
                  <span className="rueda-numero">{monto}</span>
                </span>
                <span className="rueda-monto">{girando ? "Enviando..." : `${monto} XLM`}</span>
              </button>
            );
          })}
        </div>

        {address ? (
          <p className="propinas-destino">
            Va para el creador{" "}
            <span className="cuenta-direccion" title={CREATOR_ADDRESS}>
              {abreviar(CREATOR_ADDRESS)}
            </span>
            . Vas a confirmar el monto en tu wallet antes de enviarlo.
          </p>
        ) : (
          <p className="propinas-pista">Conecta tu wallet para elegir una propina.</p>
        )}
      </section>

      {/* role="status" y role="alert": los lectores de pantalla anuncian estos mensajes al aparecer */}
      {txHash && (
        <div className="gracias" role="status">
          <p className="gracias-titulo">¡Gracias, pura vida! 🌴</p>
          <p>Tu propina de {ultimoMonto} XLM ya llegó al creador.</p>
          <a href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">
            Ver tu propina en el explorador
          </a>
        </div>
      )}
      {error && (
        <p className="aviso-error" role="alert">
          {error}
        </p>
      )}

      <footer className="pie">Funciona en la red de prueba de Stellar (Testnet). Los XLM no son dinero real.</footer>
    </main>
  );
}

export default App;