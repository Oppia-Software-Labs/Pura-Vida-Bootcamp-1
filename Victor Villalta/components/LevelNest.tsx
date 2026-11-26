import { Icon, type IconName } from "./Icon";

const basics: { icon: IconName; title: string; text: string }[] = [
  { icon: "spark", title: "Stellar", text: "Una red compartida que registra y confirma envíos de fichas digitales entre cuentas." },
  { icon: "wallet", title: "Wallet o billetera", text: "Una app que guarda tus claves y te permite autorizar acciones. En este viaje usamos Freighter." },
  { icon: "waves", title: "Testnet", text: "La red de prácticas de Stellar. Podés equivocarte y volver a intentar con fichas de prueba." },
  { icon: "egg", title: "XLM de prueba", text: "La ficha nativa de la red de pruebas. Se consigue gratis y carece de valor monetario." },
];

const glossary = [
  ["Cuenta", "Tu registro en la red. Tiene una dirección y puede guardar un saldo."],
  ["Clave pública", "Tu dirección de Stellar. Empieza con G y podés compartirla para recibir."],
  ["Clave secreta", "La credencial que controla la cuenta. Guardala en tu billetera y nunca la compartás."],
  ["Transacción", "Un paquete firmado que se envía a la red para que procese una o varias acciones."],
  ["Operación", "Una acción dentro de una transacción, como hacer un pago."],
  ["Fee", "La pequeña comisión que la red cobra al procesar una transacción."],
  ["Horizon", "El servicio que nos deja consultar cuentas, saldos y transacciones de Testnet."],
];

export function LevelNest({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="level-flow">
      <p className="lead">Antes de salir del nido, conocé las cuatro piezas que vas a usar durante el recorrido.</p>
      <div className="topic-grid">
        {basics.map(({ icon, title, text }) => (
          <article className="topic-card" key={title}>
            <span className="topic-icon"><Icon name={icon}/></span>
            <h3>{title}</h3><p>{text}</p>
          </article>
        ))}
      </div>
      <div className="notice notice-warning">
        <Icon name="lock"/>
        <p><strong>La clave secreta nunca se comparte.</strong> Baula Stellar solo usa tu dirección pública. Las firmas se aprueban dentro de Freighter.</p>
      </div>
      <section className="glossary" id="glosario" aria-labelledby="glossary-title">
        <h3 id="glossary-title"><Icon name="book"/> Mini glosario</h3>
        {glossary.map(([term, definition]) => <details key={term}><summary>{term}</summary><p>{definition}</p></details>)}
      </section>
      <div className="action-row"><button className="button button-primary" onClick={onContinue}>Entendido <Icon name="arrow"/></button></div>
    </div>
  );
}
