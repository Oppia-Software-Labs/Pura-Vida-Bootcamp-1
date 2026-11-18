import { buttonVariants } from "@/components/ui/button";
import SecurityNote from "@/components/SecurityNote";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

const steps = [
  {
    title: "Instala la extensión",
    text: "Entra al sitio oficial de Varial (antes Freighter) y agrégala a tu navegador.",
  },
  {
    title: "Crea una wallet nueva",
    text: "Abre la extensión y elige crear una cuenta nueva.",
  },
  {
    title: "Guarda tu frase de recuperación",
    text: "Anótala en papel y guárdala fuera de internet. Nunca la compartas ni la pegues en páginas web o chats.",
  },
  {
    title: "Cambia la red a Testnet",
    text: "En los ajustes de la extensión, selecciona la red de pruebas (Testnet). Esta app solo funciona ahí.",
  },
  {
    title: "Vuelve y conecta",
    text: "Recarga esta página y pulsa “Conectar wallet”. Si tu cuenta aparece sin fondear, usa el botón de Friendbot para recibir XLM de prueba.",
  },
];

export default function NoWalletGuide() {
  return (
    <section className="flex justify-center px-6 pb-12" aria-labelledby="no-wallet-title">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle id="no-wallet-title">¿No tienes una wallet?</CardTitle>
          <CardDescription>
            Sigue estos pasos para crear una en pocos minutos.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <ol className="space-y-4">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-3">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>

          <SecurityNote className="mt-5">
            Descarga la extensión solo desde el sitio oficial y verifica la dirección
            antes de instalar. Ninguna app legítima te pedirá tu frase de recuperación.
          </SecurityNote>
        </CardContent>

        <CardFooter>
          <a
            href="https://varialwallet.com"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Ir al sitio de Varial
          </a>
        </CardFooter>
      </Card>
    </section>
  );
}
