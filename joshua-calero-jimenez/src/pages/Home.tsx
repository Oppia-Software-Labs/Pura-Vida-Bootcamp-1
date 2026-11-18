import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button, Field, Notice, Panel, Status, TextButton } from "../components/ui";
import { EXPLORER_TX, MEMO_MAX_BYTES } from "../lib/config";
import { explainError, fundWithFriendbot } from "../lib/horizon";
import { addCharge, useCharges } from "../lib/storage";
import { useAccount } from "../lib/useAccount";
import {
  byteLength,
  formatXlm,
  shortAddress,
  validateAmount,
  validateDesc,
  validateLabel,
  validateMemo,
} from "../lib/validation";
import { useWallet } from "../lib/wallet";

function Account() {
  const { address, connect, connecting } = useWallet();
  const { info, loading, error, reload } = useAccount(address);
  const [funding, setFunding] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);

  const fund = async () => {
    if (!address) return;
    setFunding(true);
    setFundError(null);
    try {
      await fundWithFriendbot(address);
      reload();
    } catch (e) {
      setFundError(explainError(e));
    } finally {
      setFunding(false);
    }
  };

  if (!address)
    return (
      <div className="space-y-5">
        <p className="leading-relaxed text-muted">Conecta tu wallet para ver tu saldo y empezar a cobrar.</p>
        <Button onClick={() => void connect()} disabled={connecting}>
          Conectar wallet
        </Button>
      </div>
    );

  if (loading && !info) return <p className="text-muted">Leyendo tu cuenta…</p>;

  if (error)
    return (
      <div className="space-y-4">
        <Notice tone="danger">{error}</Notice>
        <TextButton onClick={reload}>Reintentar</TextButton>
      </div>
    );

  if (info && !info.exists)
    return (
      <div className="space-y-4">
        <p className="font-display text-xl font-light">Cuenta no activada</p>
        <p className="leading-relaxed text-muted">
          Esta dirección aún no existe en Testnet. Friendbot le da 10.000 XLM de prueba.
        </p>
        {fundError && <Notice tone="danger">{fundError}</Notice>}
        <Button onClick={() => void fund()} disabled={funding}>
          {funding ? "Fondeando…" : "Fondear con Friendbot"}
        </Button>
      </div>
    );

  if (!info) return null;

  return (
    <div>
      <p className="text-sm text-muted">Saldo</p>
      <p className="mt-2 font-display text-5xl font-light tracking-tight">
        {formatXlm(info.balance)} <span className="text-base text-muted">XLM</span>
      </p>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Puedes gastar {formatXlm(info.spendable)} XLM. Los otros {formatXlm(info.reserve)} XLM son la reserva mínima de
        la red.
      </p>
      <TextButton onClick={reload} className="mt-4">
        Actualizar
      </TextButton>
    </div>
  );
}

function CreateCharge() {
  const { address } = useWallet();
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [touched, setTouched] = useState(false);

  const errors = {
    amount: validateAmount(amount),
    memo: validateMemo(memo),
    label: validateLabel(label),
    desc: validateDesc(desc),
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!address || invalid) return;
    const c = addCharge({
      to: address,
      amount: amount.trim(),
      memo,
      label: label.trim() || undefined,
      desc: desc.trim() || undefined,
    });
    navigate(`/cobro/${c.id}`);
  };

  return (
    <Panel>
      <h2 className="font-display text-lg font-light">Nuevo cobro</h2>
      <form onSubmit={submit} noValidate className="mt-6 space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Monto en XLM"
            inputMode="decimal"
            placeholder="5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            error={touched ? errors.amount : null}
          />
          <Field
            label="Concepto"
            placeholder="cuota-nov"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            error={touched ? errors.memo : null}
            hint={`${byteLength(memo)} de ${MEMO_MAX_BYTES} bytes`}
          />
        </div>
        <Field
          label="Título (opcional)"
          placeholder="Cuota de noviembre"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          error={touched ? errors.label : null}
        />
        <Field
          label="Descripción (opcional)"
          placeholder="Para el viaje del grupo"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          error={touched ? errors.desc : null}
        />
        <Button type="submit" disabled={!address}>
          Crear link de cobro
        </Button>
        {!address && <p className="text-sm text-muted">Conecta tu wallet para crear cobros.</p>}
      </form>
    </Panel>
  );
}

function History() {
  const charges = useCharges();

  return (
    <section>
      <h2 className="font-display text-lg font-light">Tus cobros</h2>
      {charges.length === 0 ? (
        <p className="mt-4 text-muted">Los cobros que crees aparecerán aquí con su estado.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line border-y border-line">
          {charges.map((c) => (
            <li key={c.id} className="grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 py-4 sm:grid-cols-[1fr_auto_auto_auto]">
              <Link to={`/cobro/${c.id}`} className="min-w-0 hover:text-accent">
                <span className="block truncate">{c.label || c.memo}</span>
                <span className="block truncate text-sm text-muted">{c.memo}</span>
              </Link>
              <span className="text-right tabular-nums">{c.amount} XLM</span>
              <span className="hidden text-sm text-muted sm:block">
                {c.hash ? (
                  <a href={`${EXPLORER_TX}${c.hash}`} target="_blank" rel="noreferrer" className="font-mono hover:text-accent" title={c.hash}>
                    {shortAddress(c.hash)}
                  </a>
                ) : (
                  new Date(c.createdAt).toLocaleDateString("es")
                )}
              </span>
              <span className="col-span-2 sm:col-span-1">
                <Status paid={c.status === "paid"} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-20 sm:pt-28">
      <h1 className="max-w-2xl font-display text-4xl font-light leading-[1.12] tracking-tight sm:text-5xl">
        Cobra con un link y mira el pago llegar
      </h1>
      <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
        Compartes un link o un QR. Quien lo abre paga desde su wallet y tú ves el pago entrar en vivo.
      </p>

      <div className="mt-16 grid gap-12 md:grid-cols-[1fr_1.4fr] md:gap-10">
        <Account />
        <CreateCharge />
      </div>

      <div className="mt-20">
        <History />
      </div>
    </div>
  );
}
