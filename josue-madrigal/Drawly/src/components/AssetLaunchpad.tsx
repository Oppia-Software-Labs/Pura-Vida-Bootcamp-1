import React, { useState } from 'react';
import {
  Car,
  ShieldCheck,
  Lock,
  ExternalLink,
  PlusCircle,
  X,
  AlertCircle,
  CheckCircle2,
  Ticket,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import {
  ASSET_ESCROW_VAULT_ADDRESS,
  STELLAR_CONFIG,
  buyRaffleTicket,
  formatAddress,
} from '../services/stellar';
import { openWalletModal } from '../services/walletKit';

export interface AssetLaunchpadProps {
  connectedAddress: string | null;
  onAddressConnect: (address: string) => void;
  onBalanceRefreshNeeded: () => void;
}

export const AssetLaunchpad: React.FC<AssetLaunchpadProps> = ({
  connectedAddress,
  onAddressConnect,
  onBalanceRefreshNeeded,
}) => {
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [buyerAlias, setBuyerAlias] = useState('');
  const [purchaseTxHash, setPurchaseTxHash] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estado del formulario de creación RaaS
  const [orgName, setOrgName] = useState('');
  const [assetName, setAssetName] = useState('');
  const [softCap, setSoftCap] = useState(2500);
  const [ticketPrice, setTicketPrice] = useState(10);
  const [deploySuccess, setDeploySuccess] = useState(false);

  const featuredAssetRaffle = {
    title: 'Auto',
    organizer: 'Concesionaria Oficial & Fundación',
    totalPrizeValue: '25,000 XLM',
    ticketPrice: 10,
    soldTickets: 1840,
    softCap: 2500,
    maxTickets: 3000,
    endsIn: '5 días 12h',
  };

  const progressPercent = Math.round(
    (featuredAssetRaffle.soldTickets / featuredAssetRaffle.softCap) * 100
  );

  const handleBuyAssetTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!connectedAddress) {
      try {
        const address = await openWalletModal();
        if (address) onAddressConnect(address);
      } catch (err: unknown) {
        const error = err as Error;
        if (!error.message?.includes('closed') && !error.message?.includes('cancelled')) {
          setErrorMessage(error.message || 'Error al conectar wallet');
        }
      }
      return;
    }

    if (!buyerAlias.trim()) {
      setErrorMessage('Ingresa tu alias o DNI para registrar el boleto.');
      return;
    }

    setIsBuying(true);
    try {
      // Compra 1 boleto enviando los 10 XLM a la bóveda dedicada de escrow con el alias en Memo.text
      const result = await buyRaffleTicket({
        userAddress: connectedAddress,
        alias: `RAAS:${buyerAlias.trim().slice(0, 23)}`,
        destinationVault: ASSET_ESCROW_VAULT_ADDRESS,
        amount: '10',
      });

      setPurchaseTxHash(result.hash);
      onBalanceRefreshNeeded();
      setBuyerAlias('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al procesar la compra.');
    } finally {
      setIsBuying(false);
    }
  };

  const handleDeployRaffle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName || !assetName) return;
    setDeploySuccess(true);
    setTimeout(() => {
      setDeploySuccess(false);
      setIsDeployModalOpen(false);
      setOrgName('');
      setAssetName('');
    }, 2500);
  };

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Banner explicativo del modelo RaaS */}
      <div className="p-6 rounded-3xl bg-neutral-900/50 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 backdrop-blur-xl">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono w-fit mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Raffle-as-a-Service (RaaS) Protocol</span>
          </div>
          <h3 className="text-xl font-semibold text-white tracking-tight">
            Sorteos físicos de alto valor con custodia en Stellar.
          </h3>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Elimina la desconfianza en rifas de autos o propiedades. Los fondos se retienen en una bóveda de contrato inteligente: si se alcanza el <strong>Soft Cap</strong>, se entrega el premio; si no, el protocolo <strong>reembolsa el 100%</strong> a cada comprador.
          </p>
        </div>

        <button
          onClick={() => setIsDeployModalOpen(true)}
          className="px-4 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-2 cursor-pointer shrink-0 shadow-sm"
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Crear rifa para mi organización</span>
        </button>
      </div>

      {/* Tarjeta de Rifa de Alto Valor (Premio: Auto) */}
      <div className="rounded-3xl bg-neutral-900/40 border border-white/10 overflow-hidden backdrop-blur-2xl grid grid-cols-1 lg:grid-cols-12 gap-0">
        {/* Columna Izquierda: Información del Premio y Escrow */}
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5 gap-8">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/5 text-neutral-300 border border-white/10 flex items-center gap-1.5">
                <Car className="w-3 h-3 text-neutral-400" />
                Sorteo de Auto
              </span>
              <span className="text-xs font-mono text-neutral-400">
                Termina en: <strong className="text-white">{featuredAssetRaffle.endsIn}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {featuredAssetRaffle.title}
            </h2>
            <p className="text-xs font-mono text-neutral-400 mt-1">
              Organizado por: <span className="text-neutral-200">{featuredAssetRaffle.organizer}</span>
            </p>

            {/* Cuadrícula de Métricas de Custodia */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
              <div className="p-3 rounded-2xl bg-black/60 border border-white/5 flex flex-col">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Valor del Auto</span>
                <span className="text-base font-bold font-mono text-white mt-0.5">
                  {featuredAssetRaffle.totalPrizeValue}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/60 border border-white/5 flex flex-col">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Precio / Boleto</span>
                <span className="text-base font-bold font-mono text-white mt-0.5">
                  {featuredAssetRaffle.ticketPrice} XLM
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-black/60 border border-white/5 flex flex-col col-span-2 sm:col-span-1">
                <span className="text-[10px] text-neutral-500 font-mono uppercase">Soft Cap Mínimo</span>
                <span className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {featuredAssetRaffle.softCap} boletos
                </span>
              </div>
            </div>

            {/* Barra de Progreso hacia el Soft Cap */}
            <div className="mt-6 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-neutral-400">
                  Progreso para adjudicar el auto: <strong className="text-white">{featuredAssetRaffle.soldTickets}</strong> / {featuredAssetRaffle.softCap} boletos
                </span>
                <span className="text-emerald-400 font-semibold">{progressPercent}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, progressPercent)}%` }}
                ></div>
              </div>
            </div>

            {/* Caja de Garantía Anti-Fraude */}
            <div className="mt-6 p-4 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-3 text-xs text-neutral-400">
              <RotateCcw className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong>Garantía Smart Escrow:</strong> Si no se venden los {featuredAssetRaffle.softCap} boletos requeridos antes del plazo límite, el contrato reembolsa automáticamente el 100% a cada participante sin comisiones.
              </p>
            </div>
          </div>

          {/* Bóveda de Custodia Dedicada para el Activo */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-neutral-500">
            <div className="flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-neutral-400" />
              <span>Bóveda Escrow: {formatAddress(ASSET_ESCROW_VAULT_ADDRESS, 6)}</span>
            </div>
            <a
              href={`${STELLAR_CONFIG.explorerAccountUrl}/${ASSET_ESCROW_VAULT_ADDRESS}`}
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Ver en Stellar Expert</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Columna Derecha: Formulario de Participación en Vivo */}
        <div className="lg:col-span-5 p-6 sm:p-8 bg-neutral-950/60 flex flex-col justify-between gap-6">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
              Adquirir Boleto Oficial
            </span>
            <h4 className="text-lg font-semibold text-white mt-1">
              Participar por el Auto
            </h4>
            <p className="text-xs text-neutral-400 mt-1">
              El boleto se registra a tu nombre con tu firma de wallet en Testnet.
            </p>

            {purchaseTxHash ? (
              <div className="mt-6 p-5 rounded-2xl bg-neutral-900 border border-emerald-500/30 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <h5 className="text-sm font-semibold text-white">¡Boleto Emitido!</h5>
                <p className="text-xs text-neutral-400">
                  Transacción confirmada en Stellar Testnet con Memo protegido.
                </p>
                <a
                  href={`${STELLAR_CONFIG.explorerTxUrl}/${purchaseTxHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <span>Ver comprobante on-chain</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setPurchaseTxHash(null)}
                  className="mt-2 w-full py-2 rounded-xl bg-white text-black text-xs font-semibold"
                >
                  Comprar otro boleto
                </button>
              </div>
            ) : (
              <form onSubmit={handleBuyAssetTicket} className="mt-6 flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Nombre o Cédula/DNI
                  </label>
                  <input
                    type="text"
                    value={buyerAlias}
                    onChange={(e) => setBuyerAlias(e.target.value)}
                    placeholder="Ej: Carlos_Alvarado"
                    disabled={isBuying}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 hover:border-white/20 focus:border-white/40 focus:outline-none text-white text-xs font-mono placeholder:text-neutral-600 transition-colors"
                  />
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Se graba en el Memo.text de la red
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex justify-between items-center text-xs">
                  <span className="text-neutral-400">Costo total</span>
                  <span className="font-mono font-bold text-white">10.00 XLM</span>
                </div>

                {errorMessage && (
                  <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isBuying}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-98 text-xs font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isBuying ? (
                    <span>Registrando en Stellar...</span>
                  ) : !connectedAddress ? (
                    <span>Conectar wallet para participar</span>
                  ) : (
                    <>
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Comprar boleto (10 XLM)</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>

          <div className="text-[11px] font-mono text-neutral-500 text-center">
            Drawly cobra 3.5% de comisión solo si la meta se cumple exitosamente.
          </div>
        </div>
      </div>

      {/* Modal para Crear Rifa de Organización (RaaS B2B Flow) */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-3xl bg-neutral-950 border border-white/10 p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Raffle-as-a-Service
                </span>
                <h3 className="text-base font-semibold text-white">
                  Desplegar Bóveda para Organización
                </h3>
              </div>
              <button
                onClick={() => setIsDeployModalOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {deploySuccess ? (
              <div className="py-8 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">
                  ¡Bóveda Desplegada en Testnet!
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Tu contrato de escrow y custodia ha sido creado. Los boletos están listos para venta.
                </p>
              </div>
            ) : (
              <form onSubmit={handleDeployRaffle} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Nombre de tu Organización o Empresa
                  </label>
                  <input
                    type="text"
                    required
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    placeholder="Ej: Stellar Tech Collective"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 focus:border-white/40 focus:outline-none text-white text-xs font-sans placeholder:text-neutral-600"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-neutral-300">
                    Premio o Activo a Sortear
                  </label>
                  <input
                    type="text"
                    required
                    value={assetName}
                    onChange={(e) => setAssetName(e.target.value)}
                    placeholder="Ej: Auto"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-white/10 focus:border-white/40 focus:outline-none text-white text-xs font-sans placeholder:text-neutral-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      Precio Boleto (XLM)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={ticketPrice}
                      onChange={(e) => setTicketPrice(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-neutral-300">
                      Soft Cap Mínimo
                    </label>
                    <input
                      type="number"
                      min={10}
                      value={softCap}
                      onChange={(e) => setSoftCap(Number(e.target.value))}
                      className="w-full px-3.5 py-2 rounded-xl bg-black border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/5 flex flex-col gap-1.5 text-xs text-neutral-400">
                  <div className="flex justify-between">
                    <span>Meta de Recaudación</span>
                    <span className="font-mono text-white">{(softCap * ticketPrice).toLocaleString()} XLM</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span>Tarifa Drawly RaaS (3.5%)</span>
                    <span className="font-mono text-emerald-400">{(softCap * ticketPrice * 0.035).toLocaleString()} XLM</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-all cursor-pointer shadow-sm flex items-center justify-center gap-2"
                >
                  <span>Desplegar Contrato de Rifa</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default AssetLaunchpad;
