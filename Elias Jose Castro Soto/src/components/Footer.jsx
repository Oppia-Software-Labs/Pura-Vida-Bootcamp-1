export default function Footer() {
  return (
    <footer className="border-t border-border/60 px-6 py-6 text-center text-sm text-muted-foreground">
      <p>
        Hecho por <span className="text-foreground">Elias Jose Castro Soto</span> ·
        Bootcamp Pura Vida
      </p>
      <p className="mt-1">
        Construido con Stellar Wallets Kit y{" "}
        <a
          href="https://raven.stellar.org"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Raven
        </a>{" "}
        · Solo testnet, sin valor real
      </p>
    </footer>
  );
}
