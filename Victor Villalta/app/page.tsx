import Link from "next/link";
import { Icon } from "@/components/Icon";
import { TurtleSVG } from "@/components/TurtleSVG";

export default function Home() {
  return (
    <main id="contenido" className="site-shell home">
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <div className="eyebrow"><Icon name="spark" width="17" height="17"/> Aprendé Stellar desde cero</div>
          <h1 id="hero-title">Del nido <em>al mar.</em></h1>
          <p>Conectá tu billetera, explorá tu cuenta y enviá tu primer pago de prueba en Stellar. Una pequeña travesía, paso a paso.</p>
          <Link className="button button-primary" href="/viaje">Empezar el viaje <Icon name="arrow"/></Link>
        </div>
        <div aria-hidden="true" className="hero-art">
          <div className="shore-field"/>
          <TurtleSVG className="hero-turtle"/>
        </div>
      </section>
      <section className="testnet-intro" aria-labelledby="que-es-testnet">
        <span className="intro-icon"><Icon name="info" width="23" height="23"/></span>
        <div>
          <h2 id="que-es-testnet">Tu espacio para practicar</h2>
          <ul>
            <li>Testnet es la red de pruebas de Stellar.</li>
            <li>Los XLM de prueba no tienen valor monetario.</li>
            <li>No se pueden vender ni retirar.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
