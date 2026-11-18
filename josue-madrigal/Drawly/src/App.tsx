import { useState } from 'react';
import {
  Ticket,
  Clock,
  Users,
  ExternalLink,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import WalletConnect from './components/WalletConnect';
import { openWalletModal } from './services/walletKit';

interface Raffle {
  id: number;
  title: string;
  prize: string;
  ticketPriceXlm: number;
  soldTickets: number;
  totalTickets: number;
  endsIn: string;
  status: 'active' | 'ending_soon';
}

export function App() {
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [selectedRaffle, setSelectedRaffle] = useState<Raffle | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const raffles: Raffle[] = [
    {
      id: 1,
      title: 'Rifa Génesis Drawly',
      prize: '1,500 XLM',
      ticketPriceXlm: 10,
      soldTickets: 84,
      totalTickets: 150,
      endsIn: '2d 14h',
      status: 'active',
    },
    {
      id: 2,
      title: 'Soroban Alpha Pool',
      prize: '5,000 XLM',
      ticketPriceXlm: 25,
      soldTickets: 142,
      totalTickets: 200,
      endsIn: '4d 08h',
      status: 'active',
    },
    {
      id: 3,
      title: 'Sorteo Relámpago Testnet',
      prize: '500 XLM',
      ticketPriceXlm: 5,
      soldTickets: 78,
      totalTickets: 100,
      endsIn: '6 horas',
      status: 'ending_soon',
    },
  ];

  const handleOpenPurchase = (raffle: Raffle) => {
    if (!connectedAddress) {
      openWalletModal().then((addr) => {
        if (addr) setConnectedAddress(addr);
      });
      return;
    }
    setSelectedRaffle(raffle);
    setTicketQuantity(1);
    setPurchaseStatus('idle');
  };

  const handleConfirmPurchase = () => {
    setPurchaseStatus('processing');
    setTimeout(() => {
      setPurchaseStatus('success');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col font-sans selection:bg-white selection:text-black antialiased">
      {/* Navbar Minimalista Apple Style */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-black/60 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo Minimalista */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-black shadow-sm">
              <Ticket className="w-4 h-4 fill-black stroke-black" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-semibold tracking-tight text-white">
                Drawly
              </span>
              <span className="text-[10px] font-mono font-medium text-neutral-400 bg-neutral-900 border border-white/10 px-2 py-0.5 rounded-full">
                Testnet
              </span>
            </div>
          </div>

          {/* Wallet Component (Pill compacto con dropdown) */}
          <div className="flex items-center">
            <WalletConnect onAddressChange={setConnectedAddress} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-16 flex flex-col gap-20">
        {/* Hero Section Minimalista */}
        <section className="flex flex-col items-start max-w-2xl pt-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono mb-6">
            <span>Stellar Soroban</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300">Aleatoriedad Verificable</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
            Rifas descentralizadas en Stellar.
          </h1>

          <p className="mt-5 text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
            Sorteos on-chain matemáticamente verificables. Adquiere boletos directamente con tu wallet y comprueba cada resultado en el ledger público de Stellar Testnet.
          </p>

          <div className="mt-8 flex items-center gap-3">
            <a
              href="#raffles"
              className="px-5 py-2.5 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold tracking-tight transition-all duration-150 flex items-center gap-2"
            >
              <span>Ver rifas activas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </section>

        {/* Sección de Rifas (El Producto Principal) */}
        <section id="raffles" className="flex flex-col gap-6 scroll-mt-24">
          <div className="flex items-baseline justify-between border-b border-white/5 pb-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-white">
                Rifas activas
              </h2>
              <p className="text-xs text-neutral-500 font-mono mt-0.5">
                Participa con XLM en Stellar Testnet
              </p>
            </div>
            <span className="text-xs font-mono text-neutral-400">
              {raffles.length} disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {raffles.map((raffle) => {
              const progress = Math.round(
                (raffle.soldTickets / raffle.totalTickets) * 100
              );

              return (
                <div
                  key={raffle.id}
                  className="rounded-3xl bg-neutral-900/40 border border-white/5 hover:border-white/15 transition-all duration-200 p-6 flex flex-col justify-between backdrop-blur-sm group"
                >
                  <div>
                    {/* Top Status */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/5">
                        {raffle.status === 'ending_soon'
                          ? 'Por finalizar'
                          : 'Abierta'}
                      </span>
                      <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                        <Clock className="w-3 h-3 text-neutral-500" />
                        <span>{raffle.endsIn}</span>
                      </div>
                    </div>

                    {/* Título */}
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                      {raffle.title}
                    </h3>

                    {/* Ficha de Premio y Costo */}
                    <div className="mt-5 p-4 rounded-2xl bg-black/50 border border-white/5 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-tight">
                          Premio total
                        </span>
                        <div className="text-xl font-bold font-mono tracking-tight text-white">
                          {raffle.prize}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-neutral-500 uppercase font-mono tracking-tight">
                          Precio boleto
                        </span>
                        <div className="text-sm font-semibold font-mono text-neutral-300">
                          {raffle.ticketPriceXlm} XLM
                        </div>
                      </div>
                    </div>

                    {/* Barra de Progreso Monocromática Apple */}
                    <div className="mt-5">
                      <div className="flex justify-between text-xs font-mono text-neutral-400 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-neutral-500" />
                          {raffle.soldTickets} / {raffle.totalTickets} boletos
                        </span>
                        <span className="text-neutral-300">{progress}%</span>
                      </div>
                      <div className="w-full bg-neutral-800/80 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-white h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Botón de Acción */}
                  <div className="mt-6 pt-4 border-t border-white/5">
                    <button
                      onClick={() => handleOpenPurchase(raffle)}
                      className="w-full py-2.5 px-4 rounded-xl font-medium text-xs transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer bg-white text-black hover:bg-neutral-200 active:scale-98 shadow-sm"
                    >
                      <Ticket className="w-3.5 h-3.5" />
                      <span>
                        {connectedAddress ? 'Comprar boleto' : 'Conectar wallet'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Modal Minimalista de Compra de Boletos (Apple Sheet) */}
      {selectedRaffle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-950 border border-white/10 p-6 shadow-2xl flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500">
                  Participar en
                </span>
                <h3 className="text-base font-semibold text-white">
                  {selectedRaffle.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRaffle(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {purchaseStatus === 'success' ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">
                  ¡Boleto adquirido!
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Tu participación ha sido registrada en el ledger de Stellar Testnet.
                </p>
                <button
                  onClick={() => setSelectedRaffle(null)}
                  className="mt-4 w-full py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Premio</span>
                    <span className="font-mono font-semibold text-white">
                      {selectedRaffle.prize}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Precio unitario</span>
                    <span className="font-mono text-neutral-300">
                      {selectedRaffle.ticketPriceXlm} XLM
                    </span>
                  </div>

                  {/* Selector de Cantidad */}
                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-neutral-400">Cantidad</span>
                    <div className="flex items-center gap-3 bg-black px-2.5 py-1 rounded-lg border border-white/10">
                      <button
                        onClick={() =>
                          setTicketQuantity(Math.max(1, ticketQuantity - 1))
                        }
                        className="text-neutral-400 hover:text-white font-mono text-sm"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-semibold text-white w-4 text-center">
                        {ticketQuantity}
                      </span>
                      <button
                        onClick={() => setTicketQuantity(ticketQuantity + 1)}
                        className="text-neutral-400 hover:text-white font-mono text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-baseline px-1">
                  <span className="text-xs text-neutral-400">Total a pagar</span>
                  <div className="text-lg font-bold font-mono text-white">
                    {selectedRaffle.ticketPriceXlm * ticketQuantity} XLM
                  </div>
                </div>

                <button
                  onClick={handleConfirmPurchase}
                  disabled={purchaseStatus === 'processing'}
                  className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-all duration-150 cursor-pointer disabled:opacity-50"
                >
                  {purchaseStatus === 'processing'
                    ? 'Confirmando en Stellar...'
                    : 'Confirmar compra'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Footer Minimalista (Aquí se ubica la documentación de Stellar) */}
      <footer className="border-t border-white/5 bg-black py-10 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-semibold">Drawly</span>
            <span>• Protocolo de rifas en Stellar Testnet</span>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="https://developers.stellar.org/docs"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Documentación de Stellar</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <span>Stellar Expert</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://friendbot.stellar.org"
              target="_blank"
              rel="noreferrer"
              className="text-neutral-400 hover:text-white transition-colors"
            >
              Friendbot
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
export default App;
