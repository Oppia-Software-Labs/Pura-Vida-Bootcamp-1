import { displayDecimal } from "@/lib/stellar/amount";
import { explorerLink } from "@/lib/stellar/config";
import type { PaymentReceipt } from "@/lib/stellar/payment";
import { Icon } from "./Icon";
import { TurtleSVG } from "./TurtleSVG";

export function Celebration({ receipt }: { receipt: PaymentReceipt | null }) {
  return (
    <div className="level-flow">
      <div className="celebration">
        <div className="celebration-copy">
          <p className="eyebrow"><Icon name="spark" width="17" height="17"/> Viaje completado</p>
          <h3>¡Llegaste al mar!</h3>
          <p>Ya conectaste tu billetera, leíste tu cuenta y enviaste tu primer pago en Testnet.</p>
          <p className="muted">Tu práctica termina aquí. Los XLM que usaste son de prueba y no tienen valor real.</p>
        </div>
        <div className="celebration-art" aria-hidden="true">
          <TurtleSVG className="celebration-turtle"/>
          {[0, 1, 2, 3, 4, 5, 6].map((dot) => <span key={dot} className={`plankton plankton-${dot}`}/>)}
        </div>
      </div>
      {receipt && (
        <div className="wallet-card">
          <h3 className="wallet-heading"><Icon name="check"/> Pago confirmado en Testnet</h3>
          <p>{displayDecimal(receipt.amount)} XLM de prueba</p>
          <p className="muted">Hash de la transacción</p>
          <div className="copy-line"><code>{receipt.hash}</code></div>
          <a className="text-link" href={explorerLink("tx", receipt.hash)} rel="noreferrer" target="_blank">Ver en el explorador de Testnet <Icon name="external" width="15" height="15"/></a>
        </div>
      )}
    </div>
  );
}
