export default function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="section-container flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-accent flex items-center justify-center font-bold text-white text-xs">
            K
          </div>
          <span className="text-white font-semibold">Koired</span>
        </div>

        <p className="text-muted text-sm text-center">
          Construido sobre{" "}
          <a href="https://stellar.org" target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Stellar Testnet
          </a>{" "}
          · Pura Vida Bootcamp · 2026
        </p>

        <div className="flex items-center gap-6">
          {["Privacidad", "Términos", "Contacto"].map((item) => (
            <a key={item} href="#" className="text-muted text-sm hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}
