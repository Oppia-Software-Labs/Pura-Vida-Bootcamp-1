import { useMemo, useState, type FormEvent } from "react";
import {
  CircleCheck,
  ExternalLink,
  Languages,
  Search,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { Badge } from "./components/ui/badge";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { WalletBanner } from "./components/wallet-banner";
import { ProfileView } from "./components/profile-view";
import { RecognitionSheet } from "./components/recognition-sheet";
import { translations, type Locale } from "./lib/i18n";
import { PROOFOLIO_CONTRACT_ID } from "./lib/proofolio";
import { isValidAccountAddress, truncateAddress } from "./lib/stellar";
import { useWallet } from "./hooks/use-wallet";

export function App() {
  const [locale, setLocale] = useState<Locale>("es");
  const [query, setQuery] = useState("");
  const [searchedAddress, setSearchedAddress] = useState("");
  const [searchError, setSearchError] = useState("");
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const wallet = useWallet();
  const copy = useMemo(() => translations[locale], [locale]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const address = query.trim();
    if (!isValidAccountAddress(address)) {
      setSearchError(copy.invalidAddress);
      return;
    }
    setSearchError("");
    setSearchedAddress(address);
  }

  function toggleLocale() {
    const nextLocale = locale === "es" ? "en" : "es";
    setLocale(nextLocale);
    document.documentElement.lang = nextLocale;
  }

  function handleIssued(recipient: string) {
    setQuery(recipient);
    setSearchedAddress(recipient);
    setSearchError("");
    setProfileRefreshKey((current) => current + 1);
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[70] -translate-y-20 rounded-[10px] bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform focus:translate-y-0"
      >
        {copy.skipToContent}
      </a>

      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex min-h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#main-content" className="group inline-flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-[10px] bg-primary text-sm font-bold text-primary-foreground">
              P
            </span>
            <span className="text-base font-semibold tracking-tight">Proofolio</span>
          </a>

          <div className="flex items-center gap-2">
            <a
              href={`https://stellar.expert/explorer/testnet/contract/${PROOFOLIO_CONTRACT_ID}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-border px-3 text-sm font-medium transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <ExternalLink aria-hidden="true" className="size-4" />
              <span>{copy.viewOnStellar}</span>
            </a>
            <Badge className="hidden sm:inline-flex">
              <span className="mr-1.5 size-1.5 rounded-full bg-primary" aria-hidden="true" />
              {copy.testnet}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLocale}
              aria-label={copy.languageLabel}
            >
              <Languages aria-hidden="true" className="size-[18px]" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => void wallet.connect()}
              disabled={wallet.state.status === "connecting" || wallet.state.status === "funding"}
              title={wallet.state.connection?.address}
            >
              <WalletCards aria-hidden="true" className="size-[18px]" />
              <span className="hidden sm:inline">
                {wallet.state.connection
                  ? truncateAddress(wallet.state.connection.address)
                  : copy.connectWallet}
              </span>
              <span className="sm:hidden">
                {wallet.state.connection ? copy.connectedWallet : copy.connectWallet}
              </span>
            </Button>
          </div>
        </div>
      </header>

      <WalletBanner
        copy={copy}
        state={wallet.state}
        onConnect={wallet.connect}
        onFund={wallet.fund}
        onDisconnect={wallet.disconnect}
      />

      <main id="main-content">
        <section className="border-b border-border">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-18 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:items-end lg:px-8 lg:py-22">
            <div className="max-w-3xl">
              <div className="mb-5 flex flex-wrap items-center gap-2 sm:hidden">
                <Badge>{copy.testnet}</Badge>
              </div>
              <h1 className="max-w-[17ch] text-balance text-[2.35rem] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[3.35rem]">
                {copy.heroTitle}
              </h1>
              <p className="mt-5 max-w-[65ch] text-pretty text-base leading-7 text-muted-foreground sm:text-lg">
                {copy.heroBody}
              </p>
              <p className="mt-5 inline-flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-primary" />
                {copy.signedNotVerified}
              </p>
            </div>

            <form
              className="rounded-[14px] bg-surface p-4 sm:p-5"
              onSubmit={handleSearch}
              aria-label={copy.searchLabel}
            >
              <label htmlFor="profile-address" className="mb-2 block text-sm font-semibold">
                {copy.searchLabel}
              </label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  id="profile-address"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={copy.searchPlaceholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-mono"
                  aria-invalid={searchError ? true : undefined}
                  aria-describedby={searchError ? "profile-address-error" : undefined}
                />
                <Button type="submit" className="shrink-0">
                  <Search aria-hidden="true" className="size-[18px]" />
                  {copy.searchAction}
                </Button>
              </div>
              {searchError ? (
                <p id="profile-address-error" className="mt-2 text-sm font-medium text-destructive" role="alert">
                  {searchError}
                </p>
              ) : null}
            </form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="mb-7 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{copy.profileHeading}</h2>
              {searchedAddress ? (
                <p className="mt-1 max-w-[44ch] truncate font-mono text-sm text-muted-foreground">
                  {searchedAddress}
                </p>
              ) : null}
            </div>

            <RecognitionSheet
              copy={copy}
              locale={locale}
              connection={wallet.state.connection}
              account={wallet.state.account}
              onIssued={handleIssued}
            />
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_19rem]">
            {searchedAddress ? (
              <ProfileView
                key={`${searchedAddress}-${profileRefreshKey}`}
                address={searchedAddress}
                copy={copy}
                locale={locale}
              />
            ) : (
              <>
                <section aria-labelledby="timeline-heading">
                  <h3 id="timeline-heading" className="sr-only">
                    {copy.profileHeading}
                  </h3>
                  <div className="grid min-h-72 place-items-center rounded-[14px] border border-dashed border-border bg-surface/50 px-5 py-10 text-center">
                    <div className="max-w-md">
                      <span className="mx-auto grid size-11 place-items-center rounded-full bg-primary-soft text-primary-ink">
                        <Search aria-hidden="true" className="size-5" />
                      </span>
                      <h4 className="mt-4 text-base font-semibold">{copy.emptyTitle}</h4>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.emptyBody}</p>
                    </div>
                  </div>
                </section>

                <aside aria-labelledby="projects-heading">
                  <h3 id="projects-heading" className="text-sm font-semibold">
                    {copy.projectsHeading}
                  </h3>
                  <p className="mt-3 border-t border-border pt-4 text-sm leading-6 text-muted-foreground">
                    {copy.projectsEmpty}
                  </p>
                </aside>
              </>
            )}
          </div>
        </section>

        <section className="border-y border-border bg-surface">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <h2 className="text-lg font-semibold tracking-tight">{copy.howTitle}</h2>
            <ol className="mt-6 grid gap-4 md:grid-cols-3">
              {copy.howSteps.map((step, index) => (
                <li key={step} className="flex gap-3 border-t border-border pt-4">
                  <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
                  <span className="text-sm leading-6">
                    <span className="sr-only">{index + 1}. </span>
                    {step}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-4 py-7 text-sm text-muted-foreground sm:px-6 lg:px-8">
        {copy.footer}
      </footer>
    </div>
  );
}
