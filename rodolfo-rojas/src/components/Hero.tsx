export function Hero() {
  return (
    <header className="py-16 text-center sm:py-24">
      <div className="text-7xl" aria-hidden>👵✨</div>
      <h1 className="mt-6 font-display text-5xl font-extrabold tracking-tight sm:text-6xl">
        Abuelita Stellar
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-lg">
        Blockchain, wallets y smart contracts explicados como te los explicaría tu abuela: con la
        pulpería, el bus y el SINPE.
      </p>
      <blockquote className="mx-auto mt-8 max-w-lg border-l-4 border-terracota pl-4 text-left italic">
        “Si no podés explicarlo de forma simple, es que no lo entendés lo suficiente.”
        <span className="mt-1 block text-sm not-italic opacity-70">— atribuido a Richard Feynman</span>
      </blockquote>
      <nav className="mt-10 flex flex-wrap justify-center gap-3">
        <a href="#wallet" className="rounded-full bg-terracota px-5 py-2 font-bold text-crema hover:opacity-90">
          Conectar wallet
        </a>
        <a href="#cuentos" className="rounded-full border-2 border-cafe px-5 py-2 font-bold hover:bg-cafe hover:text-crema">
          Ver los cuentos
        </a>
      </nav>
    </header>
  )
}
