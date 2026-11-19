import { useState } from "react";
import { sendContribution } from "../lib/stellar.js";
import { POOL_ADDRESS, MIN_CONTRIBUTION, MAX_CONTRIBUTION } from "../constants/stellar.js";

function FilaTx({ payment }) {
  const fecha = new Date(payment.createdAt).toLocaleDateString("es-CR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  const truncar = (str) => (str ? `${str.slice(0, 6)}...${str.slice(-4)}` : "—");
  const esContribucion = payment.to === POOL_ADDRESS;

  return (
    <tr className="border-b border-border last:border-0 hover:bg-white/[0.015] transition-colors">
      <td className="py-3.5 pr-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            payment.type === "payment" ? (esContribucion ? "bg-accent" : "bg-green-400") : "bg-yellow-400"
          }`} />
          <span className="text-white text-sm capitalize">
            {payment.type === "payment"
              ? esContribucion ? "Contribución" : "Pago"
              : "Creación de cuenta"}
          </span>
        </div>
      </td>
      <td className="py-3.5 pr-4 text-muted text-xs">{fecha}</td>
      <td className="py-3.5 pr-4">
        <span className={`text-sm font-medium ${payment.amount ? "text-white" : "text-muted"}`}>
          {payment.amount ? `${parseFloat(payment.amount).toFixed(2)} XLM` : "—"}
        </span>
      </td>
      <td className="py-3.5 text-muted text-xs font-mono">
        {truncar(payment.to ?? payment.sourceAccount)}
      </td>
    </tr>
  );
}

function TarjetaStat({ etiqueta, valor, sub, acento }) {
  return (
    <div className="bg-[#161616] border border-border rounded-2xl p-5">
      <p className="text-muted text-xs mb-2">{etiqueta}</p>
      <p className={`text-2xl font-bold ${acento ? "text-accent" : "text-white"}`}>{valor}</p>
      {sub && <p className="text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard({
  publicKey,
  account,
  payments,
  poolBalance,
  loading,
  fundingLoading,
  accountNotFound,
  error,
  onFundAccount,
  onRefresh,
  onDisconnect,
  signXDR,
}) {
  const [monto, setMonto] = useState("5");
  const [enviando, setEnviando] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [txError, setTxError] = useState(null);

  async function handleContribuir(e) {
    e.preventDefault();
    setTxHash(null);
    setTxError(null);
    setEnviando(true);
    try {
      const result = await sendContribution(publicKey, monto, signXDR);
      setTxHash(result.hash);
      onRefresh();
    } catch (err) {
      const msg = err?.response?.data?.extras?.result_codes?.transaction
        ?? err?.message
        ?? "La transacción falló";
      setTxError(msg);
    } finally {
      setEnviando(false);
    }
  }

  const saldoXLM = account?.xlmBalance ?? "0";
  const truncPoolAddress = `${POOL_ADDRESS.slice(0, 8)}...${POOL_ADDRESS.slice(-6)}`;
  const contribucionesAlPool = payments.filter((p) => p.to === POOL_ADDRESS).length;

  return (
    <section id="app" className="py-24 bg-[#080808]">
      <div className="section-container">

        {/* Encabezado */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Conectado — Stellar Testnet</span>
            </div>
            <h2 className="text-3xl font-bold text-white mb-1">Tu Panel de Pensión</h2>
            <p className="text-muted text-xs font-mono break-all">{publicKey}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 text-muted hover:text-white text-xs border border-border rounded-full px-4 py-2 hover:border-accent/30 transition-colors disabled:opacity-50"
            >
              <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Actualizar
            </button>
            <button
              onClick={onDisconnect}
              className="text-muted hover:text-red-400 text-xs border border-border rounded-full px-4 py-2 hover:border-red-400/30 transition-colors"
            >
              Desconectar
            </button>
          </div>
        </div>

        {/* Aviso: cuenta no activada */}
        {accountNotFound && (
          <div className="bg-yellow-500/8 border border-yellow-500/25 rounded-2xl p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="text-yellow-400 font-semibold mb-1">Cuenta no activada</p>
              <p className="text-muted text-sm">
                Tu cuenta en testnet no existe todavía. Fúndala con el Friendbot de Stellar para recibir 10,000 XLM de prueba.
              </p>
            </div>
            <button
              onClick={onFundAccount}
              disabled={fundingLoading}
              className="btn-primary whitespace-nowrap disabled:opacity-60 text-sm"
            >
              {fundingLoading ? "Financiando…" : "Fondear con Friendbot"}
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-4 mb-8">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <TarjetaStat
            etiqueta="Tu saldo XLM"
            valor={loading ? "…" : `${parseFloat(saldoXLM).toFixed(2)} XLM`}
            sub="Stellar Testnet"
            acento
          />
          <TarjetaStat
            etiqueta="Saldo del pool"
            valor={`${parseFloat(poolBalance).toFixed(2)} XLM`}
            sub={truncPoolAddress}
          />
          <TarjetaStat
            etiqueta="Tus contribuciones"
            valor={String(contribucionesAlPool)}
            sub="transacciones al pool"
          />
          <TarjetaStat
            etiqueta="Red"
            valor="Testnet"
            sub="Stellar SDF"
          />
        </div>

        {/* Contenido principal */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* Formulario de contribución */}
          <div className="lg:col-span-2 bg-[#161616] border border-border rounded-2xl p-6">
            <h3 className="text-white font-semibold text-base mb-1">Contribuir al Pool</h3>
            <p className="text-muted text-xs mb-6 leading-relaxed">
              Envía XLM directamente al fondo de pensión en Stellar testnet.
              La transacción queda registrada de forma inmutable on-chain.
            </p>

            <form onSubmit={handleContribuir} className="flex flex-col gap-4">
              <div>
                <label className="text-muted text-xs font-medium block mb-2">Monto (XLM)</label>
                <input
                  type="number"
                  min={MIN_CONTRIBUTION}
                  max={MAX_CONTRIBUTION}
                  step="0.1"
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-border text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors placeholder:text-muted"
                  placeholder="1 – 100 XLM"
                  required
                />
              </div>

              <div className="bg-[#1e1e1e] border border-border rounded-xl px-4 py-3">
                <p className="text-muted text-xs mb-1">Destino</p>
                <p className="text-white text-xs font-mono">{truncPoolAddress}</p>
                <p className="text-muted text-xs mt-0.5">Pool de Pensión Koired</p>
              </div>

              <button
                type="submit"
                disabled={enviando || accountNotFound}
                className="btn-primary w-full text-sm py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {enviando ? "Firmando y enviando…" : "Enviar contribución"}
              </button>
            </form>

            {txHash && (
              <div className="mt-5 bg-green-500/8 border border-green-500/25 rounded-xl p-4">
                <p className="text-green-400 text-sm font-semibold mb-1.5">¡Transacción exitosa!</p>
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent text-xs hover:underline font-mono break-all"
                >
                  {txHash.slice(0, 24)}…{txHash.slice(-8)}
                </a>
              </div>
            )}

            {txError && (
              <div className="mt-5 bg-red-500/8 border border-red-500/25 rounded-xl p-4">
                <p className="text-red-400 text-sm">{txError}</p>
              </div>
            )}
          </div>

          {/* Historial de transacciones */}
          <div className="lg:col-span-3 bg-[#161616] border border-border rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-white font-semibold text-base">Historial de transacciones</h3>
                <p className="text-muted text-xs mt-0.5">Últimos 10 pagos en Stellar testnet</p>
              </div>
              {loading && (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
            </div>

            {payments.length === 0 && !loading ? (
              <div className="text-center py-16">
                <div className="w-12 h-12 rounded-2xl bg-[#1e1e1e] border border-border flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-muted text-sm">Sin transacciones aún</p>
                <p className="text-muted/50 text-xs mt-1">Realiza tu primera contribución arriba</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      {["Tipo", "Fecha", "Monto", "Destino"].map((h) => (
                        <th key={h} className="text-left text-muted text-xs font-medium pb-3 pr-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <FilaTx key={p.id} payment={p} />
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {payments.length > 0 && (
              <a
                href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-accent text-xs hover:underline mt-5"
              >
                Ver todo en Stellar Expert →
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
