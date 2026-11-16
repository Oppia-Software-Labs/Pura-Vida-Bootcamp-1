import { Hero } from './components/Hero'
import { Section } from './components/Section'

function App() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <Hero />
      <Section id="wallet" emoji="👛" title="Conectá tu wallet">
        Pronto: conectá Freighter, xBull o Lobstr y probá todo en testnet.
      </Section>
      <Section id="cuentos" emoji="📚" title="Los cuentos">
        Pronto: ocho conceptos de Stellar contados como si fuera la abuelita.
      </Section>
      <Section id="preguntar" emoji="💬" title="Preguntale a la abuelita">
        Pronto: hacé cualquier pregunta y te la explican en palabras simples.
      </Section>
    </main>
  )
}

export default App
