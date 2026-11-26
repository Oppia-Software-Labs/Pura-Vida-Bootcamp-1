"use client";

import { useState } from "react";
import { formatXlm } from "@/lib/stellar";
import { VARIAL_URL, type Balance, type Wallet } from "@/wallet/useWallet";
import styles from "./WalletSteps.module.css";

function NetworkWarning({ network }: { network: string }) {
  if (!network || network === "TESTNET") return null;
  return (
    <p className={styles.warn}>
      ⚠️ Varial está en <b>{network}</b>. Cámbiala a <b>Testnet</b> en sus ajustes: este viaje usa
      la red de pruebas, con dinero que no es real.
    </p>
  );
}

function ConnectButton({ wallet }: { wallet: Wallet }) {
  return (
    <>
      <button className={styles.primary} onClick={wallet.connect} disabled={wallet.connecting}>
        {wallet.connecting ? "Conectando…" : "Conectar Varial"}
      </button>
      {wallet.missing && (
        <p className={styles.error}>
          No encontramos Varial (antes Freighter).{" "}
          <a href={VARIAL_URL} target="_blank" rel="noreferrer">
            Instálala
          </a>
          , crea una cuenta y recarga la página.
        </p>
      )}
      {wallet.error && <p className={styles.error}>{wallet.error}</p>}
    </>
  );
}

/** Capítulo 3: conectar la wallet y entender las dos claves. */
export function AccountStep({ wallet }: { wallet: Wallet }) {
  const [copied, setCopied] = useState(false);

  if (!wallet.connected) {
    return (
      <div className={styles.box}>
        <p className={styles.lead}>Conecta tu wallet para que nazca tu estrella en la galaxia.</p>
        <ConnectButton wallet={wallet} />
      </div>
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // El portapapeles puede no estar disponible; no es grave
    }
  }

  return (
    <div className={styles.box}>
      <div className={styles.key}>
        <div className={styles.keyHead}>
          <span>🌐 Clave pública</span>
          <button className={styles.link} onClick={copy}>
            {copied ? "¡Copiada!" : "Copiar"}
          </button>
        </div>
        <code className={styles.address}>{wallet.address}</code>
        <small>Es tu dirección: compártela para recibir pagos.</small>
      </div>

      <div className={`${styles.key} ${styles.secret}`}>
        <div className={styles.keyHead}>
          <span>🔒 Clave secreta</span>
        </div>
        <code className={styles.address}>S•••••••••••••••••••••••••••••••</code>
        <small>Varial la guarda cifrada. Ninguna app, tampoco esta, puede verla.</small>
      </div>

      <NetworkWarning network={wallet.network} />
      <button className={styles.link} onClick={wallet.disconnect}>
        Desconectar
      </button>
    </div>
  );
}

/** Capítulo 4: la reserva mínima y Friendbot. */
export function ReserveStep({
  wallet,
  balance,
  onReplay,
}: {
  wallet: Wallet;
  balance: Balance;
  /** Repite en la galaxia la llegada de los fondos. */
  onReplay: () => void;
}) {
  if (!wallet.connected) {
    return (
      <div className={styles.box}>
        <p className={styles.lead}>Primero conecta tu wallet (capítulo anterior).</p>
        <ConnectButton wallet={wallet} />
      </div>
    );
  }

  const b = balance.balance;
  return (
    <div className={styles.box}>
      {b === undefined && !balance.error && <p className={styles.lead}>Consultando la red…</p>}

      {b === null && (
        <>
          <p className={styles.lead}>
            Tu estrella está apagada: la cuenta <b>todavía no existe en la red</b>, porque nadie le ha
            enviado XLM.
          </p>
          <button className={styles.primary} onClick={balance.fund} disabled={balance.funding}>
            {balance.funding ? "Pidiendo fondos…" : "Pedir 10 000 XLM a Friendbot"}
          </button>
        </>
      )}

      {typeof b === "string" && (
        <>
          <p className={styles.balance}>
            {formatXlm(b)} <span>XLM</span>
          </p>
          {balance.fundedHere ? (
            <p className={styles.lead}>
              Friendbot te envió XLM y tu cuenta <b>ya existe en la red</b>.
            </p>
          ) : (
            <p className={styles.lead}>
              Tu cuenta <b>ya tenía XLM</b>, así que ya existe en la red. Friendbot solo da fondos a
              cuentas que todavía no existen, por eso aquí no hace falta pedírselos.
            </p>
          )}
          <p className={styles.lead}>
            De ese saldo, <b>1 XLM queda reservado</b> mientras la cuenta exista; el resto lo puedes
            enviar.
          </p>
          <div className={styles.row}>
            <button className={styles.link} onClick={onReplay}>
              Ver otra vez cómo llegan los fondos
            </button>
            <button className={styles.link} onClick={balance.refresh}>
              Actualizar saldo
            </button>
          </div>
        </>
      )}

      {balance.error && <p className={styles.error}>{balance.error}</p>}
      <NetworkWarning network={wallet.network} />
    </div>
  );
}
