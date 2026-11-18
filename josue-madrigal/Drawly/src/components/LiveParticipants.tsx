import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Coins,
  AlertCircle,
  Ticket,
  Trophy,
  Sparkles,
  Calculator,
  X,
  ShieldCheck,
  Binary,
  Lock,
  RotateCcw,
} from 'lucide-react';
import {
  fetchLiveParticipants,
  executeVerifiableDraw,
  formatAddress,
  STELLAR_CONFIG,
  type ParticipantEntry,
  type DrawWinnerResult,
} from '../services/stellar';

export interface LiveParticipantsProps {
  vaultAddress?: string;
}

export const LiveParticipants: React.FC<LiveParticipantsProps> = ({ vaultAddress }) => {
  const [entries, setEntries] = useState<ParticipantEntry[]>([]);
  const [totalPotXlm, setTotalPotXlm] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Estados del Sorteo Verificable On-Chain (congelado de cierre persistente)
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [drawResult, setDrawResult] = useState<DrawWinnerResult | null>(() => {
    try {
      const saved = localStorage.getItem('drawly_concluded_draw');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [copiedLedgerHash, setCopiedLedgerHash] = useState<boolean>(false);

  const loadParticipants = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchLiveParticipants(vaultAddress);
      setEntries(data.entries);
      setTotalPotXlm(data.totalPotXlm);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error cargando participantes:', e);
      setError('No se pudo sincronizar con Horizon Testnet. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [vaultAddress]);

  // Carga inicial
  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // Recarga automática al detectar compra de boleto en la aplicación
  useEffect(() => {
    const handleTicketBought = () => {
      setTimeout(() => {
        loadParticipants(true);
      }, 1500);
    };

    window.addEventListener('stellar:ticket-bought', handleTicketBought);
    window.addEventListener('stellar:refresh-balance', handleTicketBought);

    return () => {
      window.removeEventListener('stellar:ticket-bought', handleTicketBought);
      window.removeEventListener('stellar:refresh-balance', handleTicketBought);
    };
  }, [loadParticipants]);

  // Ejecución del Sorteo Verificable On-Chain (Snapshot de cierre)
  const handleExecuteDraw = async () => {
    if (entries.length === 0) return;
    setIsDrawing(true);
    setError(null);

    try {
      const result = await executeVerifiableDraw(entries);
      setDrawResult(result);
      try {
        localStorage.setItem('drawly_concluded_draw', JSON.stringify(result));
      } catch {
        // Ignorar si storage está deshabilitado
      }
    } catch (err: unknown) {
      const e = err as Error;
      setError(e.message || 'Error al ejecutar el sorteo verificable.');
    } finally {
      setIsDrawing(false);
    }
  };

  // Reiniciar el sorteo para permitir una nueva simulación a los evaluadores
  const handleResetDraw = () => {
    setDrawResult(null);
    try {
      localStorage.removeItem('drawly_concluded_draw');
    } catch {
      // Ignorar
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Ignorar
    }
  };

  const handleCopyLedgerHash = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedLedgerHash(true);
      setTimeout(() => setCopiedLedgerHash(false), 2000);
    } catch {
      // Ignorar
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full rounded-3xl bg-neutral-900/40 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-6">
      {/* Header del Componente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Horizon Testnet Explorer • Live Ledger
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-300" />
            <span>Lista de Participantes en Vivo</span>
          </h2>
        </div>

        {/* Métricas y Acciones */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Pozo Acumulado */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase text-neutral-500 leading-tight">
                Pozo Acumulado
              </span>
              <span className="text-xs font-bold font-mono text-white leading-tight">
                {totalPotXlm} XLM
              </span>
            </div>
          </div>

          {/* Contador de Entradas */}
          <div className="px-3 py-1.5 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-neutral-300" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase text-neutral-500 leading-tight">
                Boletos Válidos
              </span>
              <span className="text-xs font-bold font-mono text-white leading-tight">
                #{entries.length}
              </span>
            </div>
          </div>

          {/* Botón Refrescar Manualmente */}
          <button
            onClick={() => loadParticipants(true)}
            disabled={isRefreshing || isLoading}
            title="Refrescar lista desde Horizon"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-white' : ''}`}
            />
          </button>

          {/* Botón Motor de Sorteo / Estado Concluido */}
          {drawResult ? (
            <div className="flex items-center gap-2">
              <div className="px-3.5 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-medium flex items-center gap-1.5 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sorteo Concluido (#{drawResult.ledgerSequence})</span>
              </div>
              <button
                onClick={handleResetDraw}
                title="Reiniciar sorteo para permitir otra simulación a los jueces"
                className="px-3 py-2 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-neutral-300 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
                <span className="hidden sm:inline">Reiniciar Simulación</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleExecuteDraw}
              disabled={isDrawing || entries.length === 0}
              className="px-4 py-2 rounded-2xl bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isDrawing ? 'animate-spin' : ''}`} />
              <span>
                {isDrawing ? 'Tomando Snapshot...' : 'Ejecutar Sorteo de Cierre'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* TARJETA DESTACADA DEL GANADOR (Sorteo Verificable On-Chain) */}
      {drawResult && (
        <div className="p-6 rounded-3xl bg-neutral-950/90 border border-emerald-500/30 shadow-2xl backdrop-blur-2xl flex flex-col gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-mono border border-emerald-500/20 mb-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Sorteo Verificable On-Chain • Entropía Stellar</span>
                </div>
                <h3 className="text-xl font-bold tracking-tight text-white">
                  ¡Boleto Ganador Seleccionado!
                </h3>
              </div>
            </div>

            <button
              onClick={handleResetDraw}
              title="Cerrar y reiniciar simulación"
              className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Ficha del Ganador */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Boleto Ganador
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  #{drawResult.winner.ticketNumber}
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  (Índice {drawResult.winnerIndex})
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Participante (Memo)
              </span>
              <div className="text-lg font-bold text-white truncate mt-2" title={drawResult.winner.alias}>
                {drawResult.winner.alias}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900/80 border border-white/5 flex flex-col justify-between">
              <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
                Dirección Ganadora
              </span>
              <div className="flex items-center justify-between mt-2 font-mono text-xs text-neutral-200">
                <span>{formatAddress(drawResult.winner.sourceAccount, 5)}</span>
                <a
                  href={`${STELLAR_CONFIG.explorerAccountUrl}/${drawResult.winner.sourceAccount}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-400 hover:text-white"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Desglose de Auditoría Criptográfica y Fórmula Matemática */}
          <div className="p-5 rounded-2xl bg-black/70 border border-white/10 flex flex-col gap-4 font-mono text-xs">
            <div className="flex items-center gap-2 text-neutral-300 font-semibold border-b border-white/5 pb-2">
              <Calculator className="w-4 h-4 text-emerald-400" />
              <span>Auditoría Criptográfica & Verificación Matemática</span>
            </div>

            {/* Datos del Ledger de Horizon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
              <div>
                <span className="text-neutral-500">Ledger de Cierre (Horizon Testnet):</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-white font-bold">#{drawResult.ledgerSequence}</span>
                  <a
                    href={`${STELLAR_CONFIG.explorerLedgerUrl}/${drawResult.ledgerSequence}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <span>Auditar en Stellar Expert</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div>
                <span className="text-neutral-500">Semilla Hexadecimal (Últimos 8 caracteres):</span>
                <div className="flex items-center gap-1.5 mt-0.5 text-white">
                  <Binary className="w-3 h-3 text-emerald-400" />
                  <span className="font-bold">0x{drawResult.seedHex}</span>
                  <span className="text-neutral-500">➔ Decimal: {drawResult.seedDecimal.toLocaleString('en-US')}</span>
                </div>
              </div>
            </div>

            {/* Hash Completo del Ledger */}
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              <span className="text-[10px] text-neutral-500 uppercase">
                Hash Completo del Ledger (Semilla Pública Inmutable):
              </span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-neutral-900 border border-white/5 text-[11px] text-neutral-300 break-all">
                <span>{drawResult.ledgerHash}</span>
                <button
                  onClick={() => handleCopyLedgerHash(drawResult.ledgerHash)}
                  className="p-1 text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0 ml-2"
                  title="Copiar hash del ledger"
                >
                  {copiedLedgerHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* La Fórmula Aplicada Paso a Paso */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] flex flex-col gap-1.5 text-neutral-300">
              <span className="font-semibold text-emerald-400">
                Fórmula Determinista Aplicada:
              </span>
              <div className="p-2 rounded-lg bg-black/60 border border-white/5 font-mono text-xs text-white">
                parseInt(&quot;{drawResult.seedHex}&quot;, 16) % {drawResult.participantsCount} = {drawResult.seedDecimal} % {drawResult.participantsCount} = <strong className="text-emerald-400">Índice {drawResult.winnerIndex}</strong> (Boleto #{drawResult.winner.ticketNumber})
              </div>
              <p className="text-[10px] text-neutral-400 leading-normal">
                Cualquier persona puede auditar este resultado: abre el ledger #{drawResult.ledgerSequence} en Stellar Expert, toma los últimos 8 caracteres del hash, conviértelos a entero y calcula el residuo con el número de participantes.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manejo de Error */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadParticipants(true)}
            className="underline hover:text-white cursor-pointer ml-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado Cargando */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-500 font-mono text-xs animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
          <span>Consultando transacciones en Horizon Testnet...</span>
        </div>
      ) : entries.length === 0 ? (
        /* Estado Vacío */
        <div className="py-12 flex flex-col items-center text-center gap-3 text-neutral-400">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
            <Ticket className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Aún no hay participantes en este sorteo
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Sé el primero en adquirir un boleto enviando 1 XLM con tu alias a la Bóveda del Sorteo.
            </p>
          </div>
        </div>
      ) : (
        /* Tabla / Lista de Participantes */
        <div className="flex flex-col gap-2">
          {/* Cabecera de Columnas */}
          <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-neutral-500 border-b border-white/5">
            <div className="col-span-2">Boleto</div>
            <div className="col-span-4">Participante (Memo)</div>
            <div className="col-span-3">Remitente</div>
            <div className="col-span-3 text-right">Transacción (Tx)</div>
          </div>

          {/* Filas de Participantes */}
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.hash}
                className="grid grid-cols-1 sm:grid-cols-12 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/5 hover:border-white/10 transition-all items-center gap-2 sm:gap-0 font-mono text-xs"
              >
                {/* Número de Boleto */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-bold text-xs border border-white/10">
                    #{entry.ticketNumber}
                  </span>
                  <span className="sm:hidden text-neutral-500 text-[10px]">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>

                {/* Alias del Participante */}
                <div className="sm:col-span-4 flex items-center gap-2 font-sans font-semibold text-white">
                  <span className="truncate max-w-[200px]" title={entry.alias}>
                    {entry.alias}
                  </span>
                </div>

                {/* Dirección Pública del Remitente */}
                <div className="sm:col-span-3 flex items-center gap-2 text-neutral-400">
                  <span className="text-[11px]">{formatAddress(entry.sourceAccount, 4)}</span>
                  <button
                    onClick={() => handleCopy(entry.sourceAccount)}
                    title="Copiar dirección completa"
                    className="p-1 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedHash === entry.sourceAccount ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Hash con enlace a Stellar Expert */}
                <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2 text-neutral-400">
                  <span className="hidden lg:inline text-[10px] text-neutral-500">
                    {formatDate(entry.createdAt)}
                  </span>
                  <a
                    href={`${STELLAR_CONFIG.explorerTxUrl}/${entry.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver transacción en Stellar Expert"
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 text-[11px]"
                  >
                    <span>{formatAddress(entry.hash, 3)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota al pie de verificación */}
      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
        <span>Fuente: Horizon API de Stellar Testnet • Consulta directa por cuenta</span>
        <span>Actualización reactiva tras cada compra</span>
      </div>
    </div>
  );
};
export default LiveParticipants;
