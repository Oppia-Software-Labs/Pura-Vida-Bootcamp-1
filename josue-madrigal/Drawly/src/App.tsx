import { useState } from 'react';
import {
  Ticket,
  Clock,
  Users,
  ExternalLink,
  CheckCircle2,
  X,
  ArrowRight,
  Sparkles,
  Layers,
  Building2,
} from 'lucide-react';
import WalletConnect from './components/WalletConnect';
import TicketPurchase from './components/TicketPurchase';
import LiveParticipants from './components/LiveParticipants';
import AssetLaunchpad from './components/AssetLaunchpad';
import { openWalletModal } from './services/walletKit';
import { ASSET_ESCROW_VAULT_ADDRESS } from './services/stellar';

type TabMode = 'dynamic-pools' | 'asset-launchpad';

interface DynamicRaffle {
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
  const [activeTab, setActiveTab] = useState<TabMode>('dynamic-pools');
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [selectedRaffle, setSelectedRaffle] = useState<DynamicRaffle | null>(null);
  const [ticketQuantity, setTicketQuantity] = useState<number>(1);
  const [purchaseStatus, setPurchaseStatus] = useState<'idle' | 'processing' | 'success'>('idle');

  const upcomingPools: DynamicRaffle[] = [
    {
      id: 1,
      title: 'Soroban Alpha Pool',
      prize: '5,000 XLM',
      ticketPriceXlm: 5,
      soldTickets: 142,
      totalTickets: 200,
      endsIn: '4d 08h',
      status: 'active',
    },
    {
      id: 2,
      title: 'Lightning Draw Testnet',
      prize: '500 XLM',
      ticketPriceXlm: 1,
      soldTickets: 78,
      totalTickets: 100,
      endsIn: '6 horas',
      status: 'ending_soon',
    },
  ];

  const handleOpenPurchase = (raffle: DynamicRaffle) => {
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

  const handleTriggerBalanceRefresh = () => {
    window.dispatchEvent(new Event('stellar:refresh-balance'));
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
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-12 flex flex-col gap-12">
        {/* Hero Section */}
        <section className="flex flex-col items-start max-w-2xl pt-2">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-neutral-400 text-xs font-mono mb-5">
            <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
            <span>Drawly Engine</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300">Verifiable On-Chain Raffles</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-white leading-[1.08]">
            Rifas descentralizadas y verificables.
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-400 font-normal leading-relaxed">
            Elimina la desconfianza en sorteos tradicionales. Elige entre pozos acumulativos comunitarios o rifas de activos de alto valor con custodia inteligente en Stellar Testnet.
          </p>

          {/* Selector de Metodologías Apple Style (Tabs) */}
          <div className="mt-8 flex items-center p-1 rounded-full bg-neutral-900/90 border border-white/10 w-fit backdrop-blur-md">
            <button
              onClick={() => setActiveTab('dynamic-pools')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'dynamic-pools'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dynamic Pools (Pari-Mutuel)</span>
            </button>
            <button
              onClick={() => setActiveTab('asset-launchpad')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-2 cursor-pointer ${
                activeTab === 'asset-launchpad'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Asset Launchpad (RaaS)</span>
            </button>
          </div>
        </section>

        {/* CONTENIDO TAB 1: DYNAMIC POOLS (PARI-MUTUEL) */}
        {activeTab === 'dynamic-pools' && (
          <div className="flex flex-col gap-14 animate-in fade-in duration-200">
            {/* Módulo Principal de Compra de Boletos On-Chain */}
            <section id="comprar-boleto" className="scroll-mt-24">
              <TicketPurchase
                connectedAddress={connectedAddress}
                onAddressConnect={(addr) => setConnectedAddress(addr)}
                onBalanceRefreshNeeded={handleTriggerBalanceRefresh}
              />
            </section>

            {/* Lista de Participantes en Vivo (Horizon Testnet API) */}
            <section id="participantes-en-vivo" className="scroll-mt-24">
              <LiveParticipants />
            </section>

            {/* Próximos Pozos Comunitarios */}
            <section className="flex flex-col gap-5">
              <div className="flex items-baseline justify-between border-b border-white/5 pb-3">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white">
                    Próximos pozos programados
                  </h3>
                  <p className="text-xs text-neutral-500 font-mono mt-0.5">
                    Pozos Pari-Mutuel en desarrollo para Stellar Testnet
                  </p>
                </div>
                <span className="text-xs font-mono text-neutral-400">
                  {upcomingPools.length} en espera
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {upcomingPools.map((raffle) => {
                  const progress = Math.round(
                    (raffle.soldTickets / raffle.totalTickets) * 100
                  );

                  return (
                    <div
                      key={raffle.id}
                      className="rounded-3xl bg-neutral-900/30 border border-white/5 hover:border-white/10 transition-all p-6 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/5 text-neutral-400 border border-white/5">
                            {raffle.status === 'ending_soon' ? 'Próximo' : 'Abierto'}
                          </span>
                          <div className="flex items-center gap-1.5 text-xs font-mono text-neutral-400">
                            <Clock className="w-3 h-3 text-neutral-500" />
                            <span>{raffle.endsIn}</span>
                          </div>
                        </div>

                        <h4 className="text-base font-semibold text-white">
                          {raffle.title}
                        </h4>

                        <div className="mt-4 p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-neutral-500 uppercase font-mono">
                              Premio acumulado
                            </span>
                            <div className="text-lg font-bold font-mono text-white">
                              {raffle.prize}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-neutral-500 uppercase font-mono">
                              Precio boleto
                            </span>
                            <div className="text-sm font-semibold font-mono text-neutral-300">
                              {raffle.ticketPriceXlm} XLM
                            </div>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex justify-between text-xs font-mono text-neutral-400 mb-1.5">
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3 text-neutral-500" />
                              {raffle.soldTickets} / {raffle.totalTickets} boletos
                            </span>
                            <span className="text-neutral-300">{progress}%</span>
                          </div>
                          <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-white h-1.5 rounded-full"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-white/5">
                        <button
                          onClick={() => handleOpenPurchase(raffle)}
                          className="w-full py-2 px-3 rounded-xl font-medium text-xs bg-white text-black hover:bg-neutral-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <span>Participar en este pozo</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* CONTENIDO TAB 2: ASSET LAUNCHPAD (RAFFLE-AS-A-SERVICE) */}
        {activeTab === 'asset-launchpad' && (
          <div className="flex flex-col gap-14 animate-in fade-in duration-200">
            <AssetLaunchpad
              connectedAddress={connectedAddress}
              onAddressConnect={(addr) => setConnectedAddress(addr)}
              onBalanceRefreshNeeded={handleTriggerBalanceRefresh}
            />

            {/* Lista de Participantes en Vivo para la Bóveda de Custodia Escrow (RaaS) */}
            <section id="participantes-raas" className="scroll-mt-24">
              <LiveParticipants
                vaultAddress={ASSET_ESCROW_VAULT_ADDRESS}
                title="Participantes en Custodia Escrow (RaaS)"
                subtitle="Horizon Testnet Explorer • Bóveda de Activos"
              />
            </section>
          </div>
        )}
      </main>

      {/* Modal Minimalista de Compra para Pozos Secundarios */}
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
                className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {purchaseStatus === 'success' ? (
              <div className="py-6 flex flex-col items-center text-center gap-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                <h4 className="text-base font-semibold text-white">
                  ¡Boleto confirmado!
                </h4>
                <p className="text-xs text-neutral-400 max-w-xs">
                  Tu participación ha quedado registrada en Stellar Testnet.
                </p>
                <button
                  onClick={() => setSelectedRaffle(null)}
                  className="mt-4 w-full py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/5 flex flex-col gap-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-neutral-400">Premio acumulado</span>
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

                  <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-neutral-400">Cantidad</span>
                    <div className="flex items-center gap-3 bg-black px-2.5 py-1 rounded-lg border border-white/10">
                      <button
                        onClick={() =>
                          setTicketQuantity(Math.max(1, ticketQuantity - 1))
                        }
                        className="text-neutral-400 hover:text-white font-mono text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <span className="font-mono text-xs font-semibold text-white w-4 text-center">
                        {ticketQuantity}
                      </span>
                      <button
                        onClick={() => setTicketQuantity(ticketQuantity + 1)}
                        className="text-neutral-400 hover:text-white font-mono text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

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

      {/* Footer Minimalista */}
      <footer className="border-t border-white/5 bg-black py-10 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-neutral-500 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-300 font-semibold">Drawly</span>
            <span>• Protocolo de rifas verificables en Stellar Testnet</span>
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
