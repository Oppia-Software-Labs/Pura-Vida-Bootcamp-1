import { AccountBalance } from '@/components/AccountBalance'
import { HowItWorks } from '@/components/HowItWorks'
import { MateIllustration } from '@/components/MateIllustration'
import { Badge } from '@/components/ui/badge'
import { WalletSection } from '@/components/WalletSection'
import { useAccount } from '@/hooks/useAccount'
import { useWallet } from '@/hooks/useWallet'

function App() {
  const wallet = useWallet()
  const account = useAccount(wallet.address)

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
              Una propina en XLM que viaja por Stellar. Vos firmás desde tu
              wallet y la otra persona la recibe al toque.
            </p>
          </div>
          <MateIllustration className="w-24 sm:w-36 lg:w-44" />
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
            onRefresh={account.refresh}
            onFund={account.fund}
          />
        </WalletSection>
      </main>

      <section aria-labelledby="como-funciona" className="grid content-start gap-4">
        <h2
          id="como-funciona"
          className="text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          Cómo funciona
        </h2>
        <HowItWorks />
        <p className="pt-4 text-xs text-muted-foreground">
          Hecho con Stellar Raven. Corre sobre Testnet: no usa fondos reales.
        </p>
      </section>
    </div>
  )
}

export default App
