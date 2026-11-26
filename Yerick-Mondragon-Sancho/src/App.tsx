import { useState } from "react";
import { motion, MotionConfig } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Compass,
  Globe2,
  Mountain,
  Pause,
  Play,
  Radio,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { SpaceBackground } from "./components/SpaceBackground";
import { Landscape } from "./components/Landscape";
import { WalletPanel } from "./components/WalletPanel";
import { useWallet } from "./hooks/useWallet";
import { useMotionPreference } from "./hooks/useMotionPreference";

function App() {
  const wallet = useWallet();
  const [paused, setPaused] = useState(false);
  const reducedMotion = useMotionPreference();
  const motionDisabled = paused || reducedMotion;
  const enter = {
    initial: motionDisabled ? (false as const) : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: motionDisabled ? 0 : 0.7 },
  };
  return (
    <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
      <a className="skip-link" href="#contenido">
        Saltar al contenido
      </a>
      <div
        className="site-shell"
        data-motion={motionDisabled ? "paused" : "active"}
      >
        <motion.header className="site-header page-width" {...enter}>
          <a className="brand" href="#" aria-label="Stellar Odyssey, inicio">
            <span className="brand-mark">
              <Compass size={24} strokeWidth={1.4} />
            </span>
            <span>
              STELLAR<span className="brand-secondary">ODYSSEY</span>
            </span>
          </a>
          <nav aria-label="Navegación principal">
            <a href="#mision">La misión</a>
            <a href="#ruta">Su primera órbita</a>
            <a className="nav-explorer" href="#explorador">
              Explorar <ArrowUpRight size={14} />
            </a>
          </nav>
          <span className="testnet-badge">
            <span className="status-dot" />
            TESTNET
          </span>
        </motion.header>
        <main id="contenido">
          <section className="hero-section" aria-labelledby="hero-title">
            <SpaceBackground paused={paused} />
            <div className="celestial-orbit" aria-hidden="true">
              <div className="planet" />
              <div className="planet-orbit" />
            </div>
            <div className="hero-content page-width">
              <motion.div className="hero-copy" {...enter}>
                <div className="expedition-label">
                  <span className="orange-line" />
                  EXPEDICIÓN 001 <span className="label-divider">/</span> PURA
                  VIDA BOOTCAMP
                </div>
                <h1 id="hero-title">
                  Su primera órbita
                  <br />
                  empieza en
                  <br />
                  <span>Stellar.</span>
                  <span className="title-star" aria-hidden="true">
                    ✦
                  </span>
                </h1>
                <p className="hero-description">
                  Conecte su wallet y descubra su cuenta en Stellar. Aquí puede
                  consultar su dirección pública y sus XLM de prueba, a su
                  propio ritmo.
                </p>
                <div className="hero-actions">
                  <motion.button
                    className="primary-button hero-connect"
                    whileHover={motionDisabled ? {} : { y: -2 }}
                    whileTap={motionDisabled ? {} : { scale: 0.98 }}
                    disabled={wallet.busy}
                    onClick={() => {
                      document.getElementById("explorador")?.scrollIntoView({
                        behavior: reducedMotion ? "instant" : "smooth",
                        block: "center",
                      });
                      if (!wallet.authorized) void wallet.connect();
                    }}
                  >
                    <Wallet size={18} />
                    {wallet.authorized
                      ? "Ver su cuenta"
                      : wallet.busy
                        ? "Conectando…"
                        : "Conecte su wallet"}
                    <ArrowUpRight size={18} />
                  </motion.button>
                  <a className="text-link" href="#ruta">
                    Conozca la ruta <ArrowDown size={15} />
                  </a>
                </div>
                <div className="hero-reassurance">
                  <ShieldCheck size={15} />
                  <span>Aprenda con XLM de prueba, sin usar dinero real.</span>
                </div>
                <div className="mission-marker">
                  <span className="marker-icon">
                    <Mountain size={19} />
                  </span>
                  <div>
                    <span className="mini-label">PUNTO DE PARTIDA</span>
                    <p>Desde Costa Rica, con la mirada en las estrellas.</p>
                  </div>
                </div>
              </motion.div>
              <motion.div
                className="panel-wrapper"
                {...enter}
                transition={{
                  duration: motionDisabled ? 0 : 0.8,
                  delay: motionDisabled ? 0 : 0.15,
                }}
              >
                <div className="panel-prelabel">
                  <span>↳ BITÁCORA DE VUELO</span>
                  <span>STELLAR / 001</span>
                </div>
                <WalletPanel wallet={wallet} motionDisabled={motionDisabled} />
              </motion.div>
            </div>
            <Landscape paused={motionDisabled} />
            <div className="hero-bottom page-width">
              <span>
                <Radio size={13} />
                EXPLORACIÓN EN TESTNET
              </span>
              <button
                className="motion-toggle"
                aria-pressed={paused || !!reducedMotion}
                aria-label={
                  paused
                    ? "Activar animación de fondo"
                    : "Pausar animación de fondo"
                }
                onClick={() => setPaused(!paused)}
                disabled={!!reducedMotion}
              >
                {paused || reducedMotion ? (
                  <Play size={12} />
                ) : (
                  <Pause size={12} />
                )}
                <span>
                  {reducedMotion
                    ? "Movimiento reducido"
                    : paused
                      ? "Activar movimiento"
                      : "Pausar movimiento"}
                </span>
              </button>
            </div>
          </section>
          <section
            id="mision"
            className="mission-section page-width"
            aria-labelledby="mission-title"
          >
            <div className="mission-intro">
              <span className="eyebrow">
                <span className="orange-text">✦</span> UN UNIVERSO ABIERTO
              </span>
              <h2 id="mission-title">
                Conozca la red.
                <br />
                <span>Explore a su ritmo.</span>
              </h2>
            </div>
            <div className="mission-explanation">
              <Globe2 size={26} strokeWidth={1.2} />
              <p>
                Stellar es una red abierta para mover valor y crear aplicaciones
                financieras. Su moneda nativa es el lumen: <strong>XLM</strong>.
              </p>
              <p>
                Testnet es su espacio para practicar. Funciona como una red de
                ensayo: sus XLM no tienen valor monetario.
              </p>
              <a
                className="text-link"
                href="https://developers.stellar.org/docs/learn/fundamentals/networks"
                target="_blank"
                rel="noreferrer"
              >
                Conozca Stellar <ArrowUpRight size={15} />
              </a>
            </div>
          </section>
          <section
            id="ruta"
            className="route-section page-width"
            aria-labelledby="route-title"
          >
            <div className="route-heading">
              <div>
                <span className="eyebrow">SU PRIMERA ÓRBITA</span>
                <h2 id="route-title">Tres pasos para empezar.</h2>
              </div>
              <span className="route-note">03 PASOS · USTED DECIDE CUÁNDO</span>
            </div>
            <div className="steps-grid">
              {[
                {
                  number: "01",
                  icon: Wallet,
                  title: "Prepare su wallet",
                  text: "Abra Varial (antes Freighter) en su navegador y seleccione Testnet. Esta será su red de práctica.",
                  label: "WALLET LISTA",
                },
                {
                  number: "02",
                  icon: ShieldCheck,
                  title: "Autorice el acceso",
                  text: "Presione «Conecte su wallet» y apruebe el acceso desde Varial. Su dirección pública identifica su cuenta.",
                  label: "EL PERMISO ES SUYO",
                },
                {
                  number: "03",
                  icon: Compass,
                  title: "Descubra su cuenta",
                  text: "Vea cuántos XLM de prueba tiene su cuenta. Puede copiar su dirección y actualizar el saldo cuando lo necesite.",
                  label: "SU CUENTA, A LA VISTA",
                },
              ].map(({ number, icon: Icon, title, text, label }, index) => (
                <motion.article
                  key={number}
                  className="step"
                  initial={motionDisabled ? false : { opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: motionDisabled ? 0 : 0.55,
                    delay: motionDisabled ? 0 : index * 0.1,
                  }}
                >
                  <div className="step-top">
                    <span>{number}</span>
                    <Icon size={22} strokeWidth={1.3} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <div className="step-label">
                    {label}
                    <ArrowRight size={13} />
                  </div>
                </motion.article>
              ))}
            </div>
            <div className="field-note">
              <span className="field-note-icon">i</span>
              <p>
                <strong>Una nota antes de despegar.</strong> Esta experiencia
                usa la extensión de Varial. Si su navegador móvil no la admite,
                abra la página en su computadora. Si su cuenta aún no existe en
                Testnet, encontrará las instrucciones para activarla con XLM de
                prueba.
              </p>
            </div>
          </section>
        </main>
        <footer className="site-footer page-width">
          <a className="footer-brand" href="#">
            <Compass size={18} /> STELLAR ODYSSEY
          </a>
          <div className="personal-signature">
            <span className="signature-star" aria-hidden="true">
              ✦
            </span>
            <span>
              Diseñado y desarrollado por <strong>Yerick M.</strong>
            </span>
          </div>
          <a
            href="https://github.com/Yerickmondra15/Pura-Vida-Bootcamp-1"
            target="_blank"
            rel="noreferrer"
          >
            Pura Vida Bootcamp <ArrowUpRight size={13} />
          </a>
        </footer>
      </div>
    </MotionConfig>
  );
}
export default App;
