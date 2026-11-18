import { useState } from "react";
import { Wallet, Copy, Check, LogOut } from "lucide-react";
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

const shorten = (a) => `${a.slice(0, 6)}…${a.slice(-6)}`;

export default function App() {
  const { address, loading, error, connect, disconnect } = useStellarWallet();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <main className="stars flex min-h-svh flex-col items-center justify-center gap-8 p-6">
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
  );
}
