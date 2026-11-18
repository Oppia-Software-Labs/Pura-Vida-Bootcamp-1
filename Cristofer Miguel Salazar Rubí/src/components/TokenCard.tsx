import type { ReadingToken } from "../../shared/types";
import { formatDate, shortAddress } from "../lib/format";
import { explorerAssetUrl, explorerTxUrl } from "../lib/stellar";
import { ExternalIcon, SparkIcon } from "./Icons";

export function TokenCard({ token }: { token: ReadingToken }) {
  return (
    <article className="token-card">
      <div className="token-card__top">
        <span className="token-card__seal">
          <SparkIcon size={20} />
        </span>
        <span className="token-card__network">Stellar Testnet</span>
      </div>

      <div>
        <span className="token-card__label">Sello de lectura</span>
        <h3>{token.bookTitle}</h3>
        <code>{token.assetCode}</code>
      </div>

      <div className="token-card__foot">
        <span>{formatDate(token.createdAt)}</span>
        <span>{shortAddress(token.issuer, 4)}</span>
      </div>

      <div className="token-card__links">
        <a href={explorerTxUrl(token.txHash)} target="_blank" rel="noreferrer">
          Ver emisión
          <ExternalIcon size={13} />
        </a>
        <a
          href={explorerAssetUrl(token.assetCode, token.issuer)}
          target="_blank"
          rel="noreferrer"
        >
          Ver token
          <ExternalIcon size={13} />
        </a>
      </div>
    </article>
  );
}
