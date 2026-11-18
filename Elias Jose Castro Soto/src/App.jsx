import { useState } from "react";
import { Wallet, Copy, Check, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useStellarWallet } from "@/hooks/useStellarWallet";
import { useXlmBalance } from "@/hooks/useXlmBalance";
import NoWalletGuide from "@/components/NoWalletGuide";

const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-6)}`;

export default function App() {
  const { address, loading, error, connect, disconnect } = useStellarWallet();
  const { balance, funding, error: balanceError, refresh, fund } = useXlmBalance(address);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="stars flex min-h-svh flex-col">
      <main className="flex flex-1 flex-col items-center justify-center gap-8 p-6">
        <header className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mi primera app en <span className="text-primary">Stellar</span>
          </h1>
          <p className="mt-3 text-muted-foreground">
            Conecta tu wallet y empieza a explorar la red.
          </p>
        </header>

        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wallet className="size-5 text-primary" /> Tu wallet
              </CardTitle>
              <Badge variant="outline">Testnet</Badge>
            </div>
            <CardDescription>
              {address
                ? "Wallet conectada correctamente."
                : "Conecta una wallet de Stellar para empezar."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3">
            <Badge variant={address ? "default" : "outline"}>
              {address ? "Conectado" : "Sin conexión"}
            </Badge>

            {address ? (
              <div className="flex items-center justify-between rounded-lg border bg-background/50 p-3">
                <code className="text-sm" title={address}>
                  {shorten(address)}
                </code>
                <Button variant="ghost" size="icon" onClick={copy} aria-label="Copiar dirección">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Tu dirección aparecerá aquí después de conectar.
              </p>
            )}

            {address && (
              <div className="space-y-3 rounded-lg border bg-background/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Balance (testnet)</span>
                  <Button variant="ghost" size="icon" onClick={refresh} aria-label="Actualizar balance">
                    <RefreshCw className="size-4" />
                  </Button>
                </div>

                {balance === undefined ? (
                  <p className="text-sm text-muted-foreground">Consultando…</p>
                ) : balance === null ? (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Esta cuenta aún no existe en testnet. Fondéala con XLM de prueba.
                    </p>
                    <Button size="sm" onClick={fund} disabled={funding}>
                      {funding ? "Fondeando…" : "Fondear con Friendbot"}
                    </Button>
                  </div>
                ) : (
                  <p className="text-2xl font-semibold">
                    {Number(balance).toLocaleString("es", { maximumFractionDigits: 2 })}{" "}
                    <span className="text-base text-primary">XLM</span>
                  </p>
                )}

                {balanceError && <p className="text-sm text-destructive">{balanceError}</p>}
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <CardFooter>
            {address ? (
              <Button variant="outline" className="w-full" onClick={disconnect}>
                <LogOut className="size-4" /> Desconectar
              </Button>
            ) : (
              <Button className="w-full" onClick={connect} disabled={loading}>
                {loading ? "Conectando…" : "Conectar wallet"}
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>

      <NoWalletGuide />
    </div>
  );
}
