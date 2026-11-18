import {
  Download,
  UserPlus,
  KeyRound,
  FlaskConical,
  PlugZap,
  Wallet,
  ExternalLink,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { useInView } from "@/hooks/useInView";

const steps = [
  {
    icon: Download,
    title: "Instala la extensión",
    text: "Agrega Varial (antes Freighter) desde su sitio oficial.",
  },
  {
    icon: UserPlus,
    title: "Crea una wallet nueva",
    text: "Abre la extensión y crea una cuenta.",
  },
  {
    icon: KeyRound,
    title: "Guarda tu frase de recuperación",
    text: "Anótala en papel. Nunca la compartas ni la pegues en páginas web o chats.",
  },
  {
    icon: FlaskConical,
    title: "Cambia a Testnet",
    text: "Selecciona la red de pruebas en los ajustes. Esta app solo funciona ahí.",
  },
  {
    icon: PlugZap,
    title: "Vuelve y conecta",
    text: "Recarga la página y pulsa “Conectar wallet”. Si la cuenta está vacía, usa Friendbot.",
  },
];

function Step({ icon: Icon, title, text, index, last }) {
  const [ref, inView] = useInView();

  return (
    <li
      ref={ref}
      style={{ transitionDelay: `${Math.min(index, 3) * 80}ms` }}
      className={`relative flex gap-4 transition-all duration-500 ease-out motion-reduce:transition-none ${
        last ? "" : "pb-8"
      } ${
        inView
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 motion-reduce:translate-y-0 motion-reduce:opacity-100"
      }`}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/30">
        <Icon className="size-5" aria-hidden="true" />
      </div>

      {!last && (
        <span
          aria-hidden="true"
          className="absolute left-5 top-12 bottom-2 w-px -translate-x-1/2 bg-border"
        />
      )}

      <div className="pt-1">
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </li>
  );
}

export default function NoWalletGuide() {
  return (
    <section className="flex justify-center px-6 pb-12" aria-labelledby="no-wallet-title">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle id="no-wallet-title" className="flex items-center gap-2">
            <Wallet className="size-5 text-primary" aria-hidden="true" />
            ¿No tienes una wallet?
          </CardTitle>
          <CardDescription>Créala en 5 pasos sencillos.</CardDescription>
        </CardHeader>

        <CardContent>
          <ol>
            {steps.map((s, i) => (
              <Step key={s.title} {...s} index={i} last={i === steps.length - 1} />
            ))}
          </ol>
        </CardContent>

        <CardFooter>
          <a
            href="https://varialwallet.com"
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            Ir al sitio de Varial
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        </CardFooter>
      </Card>
    </section>
  );
}
