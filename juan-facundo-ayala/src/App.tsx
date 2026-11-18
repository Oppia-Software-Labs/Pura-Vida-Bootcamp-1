import { useState } from 'react'
import { AccountBalance } from '@/components/AccountBalance'
import { HowItWorks } from '@/components/HowItWorks'
import { MateForm } from '@/components/MateForm'
import { MateHistory } from '@/components/MateHistory'
import { MateIllustration } from '@/components/MateIllustration'
import { MisionesSection } from '@/components/MisionesSection'
import { Badge } from '@/components/ui/badge'
import { WalletSection } from '@/components/WalletSection'
import { useAccount } from '@/hooks/useAccount'
import { useWallet } from '@/hooks/useWallet'

const REPO_URL =
  'https://github.com/jfacundoayala/Pura-Vida-Bootcamp-1/tree/feature/juan-facundo-ayala/juan-facundo-ayala'

const FOOTER_LINK =
  'rounded-sm underline underline-offset-4 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50'

function App() {
  const wallet = useWallet()
  const account = useAccount(wallet.address)
  // Sube cada vez que puede haber movimientos nuevos, para recargar el historial.
  const [historyVersion, setHistoryVersion] = useState(0)
  const reloadHistory = () => setHistoryVersion((version) => version + 1)

  const refreshAll = () => {
    reloadHistory()
    void account.refresh()
  }

  const fundAccount = async () => {
    await account.fund()
    reloadHistory()
  }

  // En pantallas chicas el orden es: portada, tarjetas, "cómo funciona".
  // En pantallas grandes las tarjetas pasan a la columna derecha.
  return (
    <div className="mx-auto grid w-full max-w-5xl gap-x-16 gap-y-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:grid-rows-[auto_1fr] lg:gap-y-10 lg:py-16">
      <header className="grid gap-8">
        <div className="flex items-center gap-3">
          <span className="font-heading text-xl font-semibold tracking-tight">
            Mate Stellar
          </span>
          <Badge variant="outline">Testnet</Badge>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:gap-8">
          <div className="grid gap-4">
            <h1 className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
              Convidá{' '}
              <span className="bg-[linear-gradient(transparent_62%,var(--highlight)_62%,var(--highlight)_92%,transparent_92%)] whitespace-nowrap">
                un mate
              </span>{' '}
              en segundos.
            </h1>
            <p className="max-w-md text-base text-pretty text-muted-foreground sm:text-lg">
              Una propina en XLM o en dólares digitales que viaja por Stellar.
              Vos firmás desde tu wallet y la otra persona la recibe al toque.
            </p>
          </div>
          <MateIllustration className="w-32 sm:w-48 lg:w-52" />
        </div>
      </header>

      <main className="grid content-start gap-4 lg:col-start-2 lg:row-span-2 lg:row-start-1">
        <WalletSection
          address={wallet.address}
          connecting={wallet.connecting}
          error={wallet.error}
          wrongNetwork={wallet.wrongNetwork}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        >
          <AccountBalance
            info={account.info}
            loading={account.loading}
            error={account.error}
            refreshing={account.refreshing}
            funding={account.funding}
            enabling={account.enabling}
            onRefresh={refreshAll}
            onFund={fundAccount}
            onEnable={account.enable}
          />
        </WalletSection>
        {/* La key reinicia el formulario al cambiar o desconectar la cuenta. */}
        <MateForm
          key={wallet.address ?? 'sin-wallet'}
          address={wallet.address}
          account={account.info}
          accountLoading={account.loading}
          wrongNetwork={wallet.wrongNetwork}
          onSent={refreshAll}
        />
        {wallet.address && (
          <MateHistory address={wallet.address} version={historyVersion} />
        )}
      </main>

      <section
        aria-labelledby="como-funciona"
        className="grid content-start gap-4"
      >
        <h2
          id="como-funciona"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Cómo funciona
        </h2>
        <HowItWorks />
        <h2
          id="misiones"
          className="pt-6 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          De dónde viene la yerba
        </h2>
        <MisionesSection />
        <footer className="grid gap-1 pt-4 text-xs text-muted-foreground">
          <p>
            Construido sobre{' '}
            <a
              className={FOOTER_LINK}
              href="https://stellar.org/"
              target="_blank"
              rel="noreferrer"
            >
              Stellar
            </a>
            . Corre sobre Testnet: no usa fondos reales.
          </p>
          <p>
            Lee la red con Horizon, activa cuentas con Friendbot, usa el USDC de
            Circle y muestra cada comprobante en{' '}
            <a
              className={FOOTER_LINK}
              href="https://stellar.expert/explorer/testnet"
              target="_blank"
              rel="noreferrer"
            >
              StellarExpert
            </a>
            .
          </p>
          <p>
            Hecho con{' '}
            <a
              className={FOOTER_LINK}
              href="https://raven.stellar.org/"
              target="_blank"
              rel="noreferrer"
            >
              Stellar Raven
            </a>{' '}
            para el{' '}
            <a
              className={FOOTER_LINK}
              href="https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1"
              target="_blank"
              rel="noreferrer"
            >
              Pura Vida Bootcamp
            </a>{' '}
            ·{' '}
            <a
              className={FOOTER_LINK}
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              Ver el código
            </a>
          </p>
        </footer>
      </section>
    </div>
  )
}

export default App
