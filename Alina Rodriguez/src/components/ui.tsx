import { useEffect, useState, type ReactNode } from "react";
import { Check, Clock, Lock, Plus, Wallet, X } from "lucide-react";
import { CURRENCIES, formatMoney } from "../lib/currencies";
import { actions, ME, useAppState, type Person } from "../lib/store";
import { connectWallet, isValidAddress, useWallet } from "../lib/stellar";

// Tonos suaves para los avatares (sin colores fuertes).
const TONES = ["#d7e7e0", "#f3e4cf", "#dbe8ef", "#e6e0ef", "#e9ead6", "#f0dcd8", "#d9e9e6"];

export function Avatar({ name, id }: { name: string; id?: string }) {
  const key = id ?? name;
  let h = 0;
  for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const me = id === ME;
  return (
    <span className="avatar" style={{ background: me ? "#10231e" : TONES[h % TONES.length], color: me ? "#eef3f0" : undefined }}>
      {initials || "?"}
    </span>
  );
}

export function LogoMark({ size = 20 }: { size?: number }) {
  return (
    <span className="brand-mark">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M3 15a4 4 0 0 1 8 0M13 15a4 4 0 0 1 8 0M8 10a4 4 0 0 1 8 0M2.5 19h19" />
      </svg>
    </span>
  );
}

export function Money({ amount, currency, sign, colored }: { amount: number; currency: string; sign?: boolean; colored?: boolean }) {
  const cls = colored ? (amount > 0 ? "pos" : amount < 0 ? "neg" : "") : "";
  return <span className={cls}>{formatMoney(amount, currency, { sign })}</span>;
}

export function StatusBadge({ paid }: { paid: boolean }) {
  return (
    <span className={`badge ${paid ? "paid" : "pending"}`}>
      {paid ? <Check size={13} strokeWidth={2.4} aria-hidden /> : <Clock size={13} strokeWidth={2.2} aria-hidden />}
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

export function Modal({ title, onClose, children }: { title: ReactNode; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const f = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", f);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", f);
      document.body.style.overflow = "";
    };
  }, [onClose]);
  return (
    <div className="modal-bg" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function CurrencySelect({ value, onChange, id }: { value: string; onChange: (c: string) => void; id?: string }) {
  return (
    <select id={id} className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} · {c.name}
        </option>
      ))}
    </select>
  );
}

// ---------- Toast ----------
let toastSetter: ((m: string | null) => void) | null = null;
export function toast(msg: string) {
  toastSetter?.(msg);
}
export function ToastHost() {
  const [msg, setMsg] = useState<string | null>(null);
  useEffect(() => {
    toastSetter = setMsg;
    return () => {
      toastSetter = null;
    };
  }, []);
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), 2800);
    return () => clearTimeout(t);
  }, [msg]);
  return msg ? <div className="toast" role="status">{msg}</div> : null;
}

export async function copy(text: string, msg = "Copiado") {
  try {
    await navigator.clipboard.writeText(text);
    toast(msg);
  } catch {
    window.prompt("Copia este texto:", text);
  }
}

/** Botón de pago: si no hay wallet conectada, se convierte en «Conectar wallet». */
export function WalletPayButton({ label, onPay, busy, disabled }: { label: string; onPay: () => void; busy?: boolean; disabled?: boolean }) {
  const w = useWallet();
  if (w.address)
    return (
      <button className="btn block" onClick={onPay} disabled={busy || disabled}>
        <Wallet size={18} aria-hidden /> {busy ? "Esperando tu firma…" : label}
      </button>
    );
  return <ConnectWalletButton block />;
}

/**
 * Abre el selector de Stellar Wallets Kit (LOBSTR, Varial, xBull, Albedo…).
 * Si la persona no tiene ninguna, el selector muestra el enlace para instalarla.
 */
export function ConnectWalletButton({ block, variant = "" }: { block?: boolean; variant?: "" | "on-dark" | "glass" }) {
  const w = useWallet();
  return (
    <div className="stack" style={{ gap: 6, width: block ? "100%" : undefined }}>
      <button className={`btn ${variant}${block ? " block" : ""}`} disabled={w.connecting} onClick={() => connectWallet()}>
        <Wallet size={18} aria-hidden /> {w.connecting ? "Conectando…" : "Conectar wallet"}
      </button>
      {w.error && <p className="small neg">{w.error}</p>}
    </div>
  );
}

/** Pasos para conectar la wallet por primera vez, cada uno en su línea. */
export function WalletSteps() {
  return (
    <ol className="steps">
      <li><span className="step-num">1</span><span>Instala la extensión de una wallet de Stellar en tu navegador, por ejemplo <b>Varial</b> o <b>LOBSTR</b>.</span></li>
      <li><span className="step-num">2</span><span>Ábrela, crea tu cuenta y guarda tu frase secreta en un lugar seguro.</span></li>
      <li><span className="step-num">3</span><span>En la configuración de la wallet, cambia la red a <b>Testnet</b>.</span></li>
      <li><span className="step-num">4</span><span><b>Recarga esta página</b> (F5) para que la app detecte tu wallet.</span></li>
      <li><span className="step-num">5</span><span>Presiona <b>Conectar wallet</b>, elige tu wallet de la lista y acepta la conexión.</span></li>
    </ol>
  );
}

export function TrustNote() {
  return (
    <p className="trust">
      <Lock size={14} aria-hidden /> Teja a Teja nunca ve tus llaves: cada pago lo apruebas tú en tu wallet.
    </p>
  );
}

/** Selector de personas con opción de crear una nueva al vuelo. */
export function PeoplePicker({ selected, onChange, exclude = [] }: { selected: string[]; onChange: (ids: string[]) => void; exclude?: string[] }) {
  const s = useAppState();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const people = s.people.filter((p) => !exclude.includes(p.id));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const addrOk = !address.trim() || isValidAddress(address);
  return (
    <div className="stack">
      <div className="row wrap">
        {people.map((p: Person) => (
          <button type="button" key={p.id} className={`chip${selected.includes(p.id) ? " on" : ""}`} onClick={() => toggle(p.id)}>
            {selected.includes(p.id) ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />} {p.id === ME ? "Tú" : p.name}
          </button>
        ))}
      </div>
      <div className="stack" style={{ gap: 8, padding: 14, borderRadius: 16, background: "rgba(255,255,255,.55)", border: "1px solid var(--line)" }}>
        <p className="eyebrow">Agregar persona</p>
        <label className="field">
          Nombre
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Dirección pública de su wallet Stellar (opcional)
          <input className="input mono" placeholder="Empieza con G y tiene 56 caracteres" value={address} onChange={(e) => setAddress(e.target.value)} />
        </label>
        <p className="tiny muted">Es el código que aparece en su wallet para recibir pagos. Si no tiene, déjalo vacío: podrá pagar en efectivo.</p>
        {!addrOk && <p className="small neg">Esa dirección no parece válida: debe empezar con G y tener 56 caracteres.</p>}
        <button
          type="button"
          className="btn soft sm"
          disabled={!name.trim() || !addrOk}
          onClick={() => {
            const p = actions.addPerson(name, address);
            onChange([...selected, p.id]);
            setName("");
            setAddress("");
          }}
        >
          <Plus size={16} aria-hidden /> Agregar
        </button>
      </div>
    </div>
  );
}
