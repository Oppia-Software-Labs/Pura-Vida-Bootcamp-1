import { useEffect, useState } from "react";
import type { BookDetail, PurchaseQuote } from "../../shared/types";
import { useFolio } from "../folio-context";
import { api, ApiError } from "../lib/api";
import { formatXlm, splitDeposit } from "../lib/format";
import {
  getNativeBalance,
  submitSignedXdr,
  explorerTxUrl,
} from "../lib/stellar";
import { saveAccessToken } from "../lib/storage";
import { BookCover } from "./BookCover";
import {
  AlertIcon,
  CheckIcon,
  CloseIcon,
  ExternalIcon,
  ShieldIcon,
  SparkIcon,
  WalletIcon,
} from "./Icons";

type Phase =
  | "ready"
  | "quoting"
  | "signing"
  | "submitting"
  | "confirming"
  | "success"
  | "error";

const PHASE_COPY: Record<Phase, string> = {
  ready: "",
  quoting: "Preparando el depósito…",
  signing: "Firma en tu wallet…",
  submitting: "Enviando a Stellar…",
  confirming: "Confirmando el acceso…",
  success: "Acceso desbloqueado",
  error: "",
};

export function CheckoutDialog({
  book,
  onClose,
  onPurchased,
}: {
  book: BookDetail;
  onClose: () => void;
  onPurchased: (accessToken: string) => void;
}) {
  const { wallet, refreshLibrary } = useFolio();
  const [phase, setPhase] = useState<Phase>("ready");
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<PurchaseQuote | null>(null);
  const [balance, setBalance] = useState<string | null | undefined>(undefined);
  const [funding, setFunding] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [pendingTx, setPendingTx] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const busy = ["quoting", "signing", "submitting", "confirming"].includes(
    phase,
  );

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  useEffect(() => {
    if (!wallet.address) return;

    let active = true;
    getNativeBalance(wallet.address)
      .then((value) => {
        if (active) setBalance(value);
      })
      .catch(() => {
        if (active) setBalance(undefined);
      });

    return () => {
      active = false;
    };
  }, [wallet.address]);

  async function fundReader() {
    if (!wallet.address) return;
    setFunding(true);
    setError(null);

    try {
      await api.fundAccount(wallet.address);
      const refreshed = await getNativeBalance(wallet.address);
      setBalance(refreshed);
    } catch (fundError) {
      setError(
        fundError instanceof Error
          ? fundError.message
          : "Friendbot no respondió.",
      );
    } finally {
      setFunding(false);
    }
  }

  async function buy() {
    if (!wallet.address) {
      await wallet.connect();
      return;
    }

    setError(null);

    if (pendingTx) {
      setPhase("confirming");

      try {
        const access = await api.confirmPurchase(
          book.id,
          wallet.address,
          pendingTx,
        );
        saveAccessToken(book.id, access.accessToken);
        setAccessToken(access.accessToken);
        setPendingTx(null);
        setPhase("success");
        refreshLibrary();
      } catch (confirmError) {
        setPhase("error");
        setError(describePurchaseError(confirmError));
      }
      return;
    }

    setPhase("quoting");

    try {
      const purchaseQuote = await api.getQuote(book.id, wallet.address);
      setQuote(purchaseQuote);

      setPhase("signing");
      const signedXdr = await wallet.signTransaction(purchaseQuote.xdr);

      setPhase("submitting");
      const submitted = await submitSignedXdr(signedXdr);
      setTxHash(submitted.hash);
      setPendingTx(submitted.hash);

      setPhase("confirming");
      const access = await api.confirmPurchase(
        book.id,
        wallet.address,
        submitted.hash,
      );

      saveAccessToken(book.id, access.accessToken);
      setAccessToken(access.accessToken);
      setPendingTx(null);
      setPhase("success");
      refreshLibrary();
    } catch (purchaseError) {
      setPhase("error");
      setError(describePurchaseError(purchaseError));
    }
  }

  const amounts = quote
    ? {
        fee: quote.platformFee,
        offerer: quote.offererAmount,
        total: quote.amount,
      }
    : (() => {
        const split = splitDeposit(book.price);
        return { ...split, total: book.price };
      })();

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div
        className="dialog checkout-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkout-title"
      >
        <button
          className="dialog__close"
          onClick={onClose}
          disabled={busy}
          aria-label="Cerrar"
        >
          <CloseIcon size={20} />
        </button>

        {phase === "success" ? (
          <div className="checkout-success">
            <span className="checkout-success__icon">
              <CheckIcon size={28} />
            </span>
            <span className="kicker">
              <SparkIcon size={14} />
              Depósito confirmado
            </span>
            <h2 id="checkout-title">El libro ya es tuyo.</h2>
            <p>
              Tu acceso quedó guardado. Lee a tu ritmo y, al terminar, deja una
              reseña para recibir el sello de lectura.
            </p>
            {txHash && (
              <a
                className="tx-link"
                href={explorerTxUrl(txHash)}
                target="_blank"
                rel="noreferrer"
              >
                Ver depósito en Stellar Expert
                <ExternalIcon size={14} />
              </a>
            )}
            <button
              className="btn btn--ink btn--wide"
              onClick={() => accessToken && onPurchased(accessToken)}
            >
              Empezar a leer
            </button>
          </div>
        ) : (
          <>
            <div className="checkout-head">
              <BookCover book={book} size="mini" />
              <div>
                <span className="kicker kicker--muted">Depósito de lectura</span>
                <h2 id="checkout-title">{book.title}</h2>
                <p>{book.author}</p>
              </div>
            </div>

            <div className="price-breakdown">
              <div>
                <span>Al anfitrión</span>
                <strong>{formatXlm(amounts.offerer, 7)} XLM</strong>
                <small>95% directo a {book.offererName ?? "la persona que comparte"}</small>
              </div>
              <div>
                <span>Comisión Folio</span>
                <strong>{formatXlm(amounts.fee, 7)} XLM</strong>
                <small>5% para infraestructura y sellos</small>
              </div>
              <div className="price-breakdown__total">
                <span>Total del depósito</span>
                <strong>{formatXlm(amounts.total, 7)} XLM</strong>
              </div>
            </div>

            {balance === null && (
              <div className="checkout-fund">
                <AlertIcon size={18} />
                <div>
                  <strong>Tu cuenta aún no existe en Testnet.</strong>
                  <p>Fondéala gratis con Friendbot antes de depositar.</p>
                </div>
                <button
                  className="btn btn--outline btn--small"
                  onClick={() => void fundReader()}
                  disabled={funding}
                >
                  {funding ? "Fondeando…" : "Fondear cuenta"}
                </button>
              </div>
            )}

            {wallet.networkMismatch && (
              <p className="form-error" role="alert">
                <AlertIcon size={16} />
                Cambia tu wallet a Testnet para continuar.
              </p>
            )}

            {error && (
              <p className="form-error" role="alert">
                <AlertIcon size={16} />
                {error}
              </p>
            )}

            {busy && (
              <div className="checkout-progress" role="status" aria-live="polite">
                <span className="spinner" />
                {PHASE_COPY[phase]}
              </div>
            )}

            <div className="checkout-actions">
              {wallet.address ? (
                <button
                  className="btn btn--ink btn--wide"
                  onClick={() => void buy()}
                  disabled={busy || wallet.networkMismatch || balance === null}
                >
                  <WalletIcon size={17} />
                  {pendingTx
                    ? "Confirmar pago enviado"
                    : `Depositar ${formatXlm(amounts.total)} XLM`}
                </button>
              ) : (
                <button
                  className="btn btn--ink btn--wide"
                  onClick={() => void wallet.connect()}
                  disabled={wallet.connecting}
                >
                  <WalletIcon size={17} />
                  {wallet.connecting ? "Conectando…" : "Conectar wallet"}
                </button>
              )}

              <p className="checkout-note">
                <ShieldIcon size={14} />
                El pago se firma en tu wallet. Folio nunca custodia tus fondos.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function describePurchaseError(error: unknown): string {
  if (error instanceof ApiError) return error.message;

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("reject") ||
    normalized.includes("cancel") ||
    normalized.includes("denied")
  ) {
    return "Cancelaste la firma. No se movió ningún fondo.";
  }

  if (
    normalized.includes("not found") ||
    normalized.includes("no existe") ||
    normalized.includes("account")
  ) {
    return "Tu cuenta necesita fondos en Testnet. Usa Friendbot e intenta de nuevo.";
  }

  if (normalized.includes("insufficient") || normalized.includes("underfunded")) {
    return "No tienes XLM suficiente para cubrir el depósito y la comisión de red.";
  }

  return message || "No se pudo completar el depósito.";
}
