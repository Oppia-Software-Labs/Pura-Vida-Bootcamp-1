export type KnowledgeEntry = {
  id: string
  title: string
  keywords: string[]
  facts: string
  url: string
}

const DOCS = 'https://developers.stellar.org/docs'

// Curated from the official Stellar docs with Stellar Raven (stellarDocs.search_docs / get_doc_page), 2026-11-16.
export const KNOWLEDGE: KnowledgeEntry[] = [
  {
    id: 'networks',
    title: 'Networks: Mainnet, Testnet, Futurenet',
    keywords: ['testnet', 'mainnet', 'futurenet', 'red', 'network', 'friendbot', 'faucet', 'prueba'],
    facts:
      'Stellar has three networks. Mainnet is production and uses real XLM for minimum balances, fees and rent. Testnet is free, maintained by SDF, works like Mainnet but with no real money, and resets on a regular cadence. Futurenet is for upcoming features. Friendbot funds new testnet accounts with test XLM.',
    url: `${DOCS}/learn/fundamentals/networks`,
  },
  {
    id: 'accounts',
    title: 'Accounts and minimum balance',
    keywords: ['cuenta', 'account', 'saldo minimo', 'minimum balance', 'base reserve', 'reserva', 'existir'],
    facts:
      'Accounts hold assets and sign transactions. An account only exists on the ledger with a valid keypair and the minimum balance. One base reserve is currently 0.5 XLM; an account needs at least 2 base reserves (1 XLM), plus one more per subentry such as a trustline or offer.',
    url: `${DOCS}/learn/fundamentals/stellar-data-structures/accounts`,
  },
  {
    id: 'keys',
    title: 'Keypairs, public and secret keys',
    keywords: ['llave', 'clave', 'key', 'keypair', 'secret', 'secreta', 'publica', 'public', 'firma', 'sign', 'wallet', 'billetera', 'seed'],
    facts:
      'A Stellar account is an ed25519 keypair. The public key starts with G and is the address you share. The secret key starts with S and signs transactions; whoever has it controls the account, and it cannot be recovered if lost. Wallets like Freighter/Varial, xBull or LOBSTR keep the secret and only return signatures to apps.',
    url: `${DOCS}/learn/fundamentals/stellar-data-structures/accounts`,
  },
  {
    id: 'transactions',
    title: 'Operations and transactions',
    keywords: ['transaccion', 'transaction', 'operacion', 'operation', 'ledger', 'pago', 'payment', 'enviar', 'send'],
    facts:
      'To act on the network you compose operations, bundle them into a transaction, sign it and submit it. A transaction is atomic: all of its operations apply or none do. Confirmed transactions are recorded in a ledger, closed roughly every 5 seconds.',
    url: `${DOCS}/learn/fundamentals/transactions/operations-and-transactions`,
  },
  {
    id: 'fees',
    title: 'Fees and surge pricing',
    keywords: ['fee', 'comision', 'costo', 'cobro', 'stroop', 'surge', 'pasaje', 'barato'],
    facts:
      'The minimum inclusion fee is 100 stroops (0.00001 XLM) per operation, configured by validators. The fee is a maximum bid: when a ledger is over capacity (1,000 classic operations) the network enters surge pricing and higher bids get in first. Smart contract transactions also pay a resource fee for CPU, ledger reads/writes and storage.',
    url: `${DOCS}/learn/fundamentals/fees-resource-limits-metering`,
  },
  {
    id: 'lumens',
    title: 'Lumens (XLM)',
    keywords: ['xlm', 'lumen', 'lumens', 'moneda nativa', 'native', 'supply', 'mineria', 'mining'],
    facts:
      'XLM (lumens) is the native currency of Stellar. It pays fees and minimum balances. It is not created through mining: all XLM that will ever exist was created when the network launched.',
    url: `${DOCS}/learn/fundamentals/lumens`,
  },
  {
    id: 'assets',
    title: 'Assets and issuers',
    keywords: ['asset', 'token', 'activo', 'emisor', 'issuer', 'stablecoin', 'usdc', 'vale', 'moneda', 'crear token'],
    facts:
      'Accounts can hold and transfer any asset: fiat-backed stablecoins, cryptocurrencies, bonds, points. A classic asset is identified by its code plus the issuing account. There is no special "create asset" operation: an asset comes into existence when the issuer makes a payment of it. XLM is the native asset and has no issuer.',
    url: `${DOCS}/learn/fundamentals/stellar-data-structures/assets`,
  },
  {
    id: 'trustlines',
    title: 'Trustlines',
    keywords: ['trustline', 'confianza', 'confiar', 'change trust', 'changetrust', 'aceptar'],
    facts:
      'A trustline is an explicit opt-in to hold a specific asset, created with the Change Trust operation. Without it, payments of that asset to your account fail, so nobody can push unknown assets into your wallet. Each trustline adds one base reserve (0.5 XLM) to the minimum balance. Issuers can require authorization.',
    url: `${DOCS}/build/guides/basics/verify-trustlines`,
  },
  {
    id: 'burn',
    title: 'Mint, burn and clawback',
    keywords: ['burn', 'quemar', 'mint', 'acuñar', 'emitir', 'clawback', 'destruir', 'circulacion'],
    facts:
      'Minting is the issuer paying out its asset, increasing supply. Burning removes an asset from circulation in two ways: a holder sends it back to the issuing account, or the issuer claws back a clawback-enabled asset. Clawback (CAP-35) exists so regulated issuers can revoke assets after mistakes or fraud.',
    url: `${DOCS}/build/guides/transactions/clawbacks`,
  },
  {
    id: 'soroban',
    title: 'Smart contracts (Soroban)',
    keywords: ['smart contract', 'contrato', 'contrato inteligente', 'soroban', 'rust', 'wasm', 'webassembly', 'dapp'],
    facts:
      'Soroban is the smart contracts platform on Stellar. Contracts are small programs written in Rust and compiled to WebAssembly. They are invoked through transactions; calls are simulated first to compute resources, then signed and submitted. Contract addresses start with C.',
    url: `${DOCS}/build/smart-contracts/overview`,
  },
  {
    id: 'sac',
    title: 'Stellar Asset Contract (SAC)',
    keywords: ['sac', 'stellar asset contract', 'token en contrato', 'contract token'],
    facts:
      'Every classic asset, including XLM, has a built-in Stellar Asset Contract that lets smart contracts send, receive and manage it. "Custom token" is now called "contract token".',
    url: `${DOCS}/tokens/stellar-asset-contract`,
  },
  {
    id: 'anchors',
    title: 'Anchors (on/off ramps)',
    keywords: ['anchor', 'ancla', 'ramp', 'rampa', 'fiat', 'banco', 'colones', 'dolares', 'retirar', 'depositar', 'cash'],
    facts:
      'Anchors are on- and off-ramps between Stellar and traditional finance, usually run by financial institutions or fintechs. They take fiat deposits (dollars, pesos, naira…) and issue or honor the matching asset on Stellar, and pay out fiat on withdrawal. They follow Stellar Ecosystem Proposals (SEPs); SDF maintains the Anchor Platform to run one.',
    url: `${DOCS}/learn/fundamentals/anchors`,
  },
  {
    id: 'seps',
    title: 'SEPs: SEP-1, SEP-10, SEP-6, SEP-24',
    keywords: ['sep', 'sep-10', 'sep10', 'sep-24', 'sep24', 'sep-6', 'sep-1', 'stellar.toml', 'kyc', 'autenticacion'],
    facts:
      'Stellar Ecosystem Proposals standardize how wallets talk to anchors. SEP-1 is the stellar.toml file for service discovery. SEP-10 proves account ownership with a challenge transaction (web authentication). SEP-6 is programmatic deposit/withdrawal, SEP-24 is interactive (hosted web flow) deposit/withdrawal, SEP-12 handles KYC data.',
    url: `${DOCS}/platforms/anchor-platform`,
  },
  {
    id: 'amm',
    title: 'Liquidity pools (AMMs)',
    keywords: ['liquidity pool', 'pool', 'amm', 'liquidez', 'market maker', 'swap', 'intercambio'],
    facts:
      'Automated market makers keep assets liquid 24/7 with liquidity pools instead of buy/sell orders. A pool holds two assets and prices trades with the constant product formula (Asset A * Asset B = k); bigger reserves mean prices move less per trade.',
    url: `${DOCS}/learn/fundamentals/liquidity-on-stellar-sdex-liquidity-pools`,
  },
  {
    id: 'sdex',
    title: 'SDEX (decentralized exchange)',
    keywords: ['sdex', 'dex', 'exchange', 'order book', 'oferta', 'offer', 'cambiar', 'trade'],
    facts:
      'Stellar has a built-in decentralized exchange (SDEX) where accounts post offers to buy and sell asset pairs. An order book is the collection of offers for one pair.',
    url: `${DOCS}/learn/fundamentals/liquidity-on-stellar-sdex-liquidity-pools`,
  },
  {
    id: 'path-payments',
    title: 'Path payments',
    keywords: ['path payment', 'path', 'conversion', 'convertir', 'pagar en otra moneda'],
    facts:
      'In a path payment the asset received differs from the asset sent: the payment hops through SDEX offers and/or liquidity pools (e.g. XLM → ETH → BTC → USDC). It fails if no viable exchange path exists.',
    url: `${DOCS}/build/guides/transactions/path-payments`,
  },
  {
    id: 'sponsored',
    title: 'Sponsored reserves',
    keywords: ['sponsor', 'patrocinar', 'sponsored', 'reserva patrocinada', 'pagar reserva'],
    facts:
      'Sponsored reserves (CAP-33) let one account pay the base reserves of another, so a new user does not need XLM to open an account or trustline. Both accounts must agree: Begin and End Sponsoring Future Reserves go in the same transaction.',
    url: `${DOCS}/build/guides/transactions/sponsored-reserves`,
  },
  {
    id: 'multisig',
    title: 'Signatures and multisig',
    keywords: ['multisig', 'multifirma', 'firmantes', 'signers', 'threshold', 'umbral', 'cuenta conjunta', 'joint'],
    facts:
      'An account can have several signers, each with a weight, and low/medium/high thresholds per kind of operation. Example: a joint account where any of three people can pay, but changing signers needs all three.',
    url: `${DOCS}/learn/fundamentals/transactions/signatures-multisig`,
  },
  {
    id: 'memo',
    title: 'Memos and muxed accounts',
    keywords: ['memo', 'nota', 'muxed', 'exchange', 'referencia', 'id'],
    facts:
      'A memo is an optional field to attach identifying info to a transaction (MEMO_TEXT up to 28 bytes, MEMO_ID, MEMO_HASH…). Exchanges used memos to tell users apart in a pooled account; muxed accounts (M… addresses) now do that by combining a G address with a 64-bit ID.',
    url: `${DOCS}/build/guides/transactions/pooled-accounts-muxed-accounts-memos`,
  },
  {
    id: 'scp',
    title: 'Stellar Consensus Protocol',
    keywords: ['consenso', 'consensus', 'scp', 'validador', 'validator', 'nodo', 'node', 'blockchain', 'seguridad', 'mineria'],
    facts:
      'Instead of one central system, many independent nodes approve transactions and agree on each ledger. Stellar reaches consensus with the Stellar Consensus Protocol (SCP), a Federated Byzantine Agreement design; there is no mining. Consensus prevents double spending.',
    url: `${DOCS}/learn/fundamentals/stellar-consensus-protocol`,
  },
  {
    id: 'smart-wallets',
    title: 'Smart wallets and passkeys',
    keywords: ['passkey', 'smart wallet', 'huella', 'face id', 'contract account', 'sin frase semilla'],
    facts:
      'Smart wallets are contract accounts that can be controlled with passkeys (WebAuthn, e.g. Face ID or a fingerprint) instead of a secret key, and can add rules like spending limits. There are TypeScript SDKs for them, such as Smart Account Kit (OpenZeppelin Smart Account contracts).',
    url: `${DOCS}/build/guides/contract-accounts/smart-wallets`,
  },
  {
    id: 'apis',
    title: 'RPC vs Horizon',
    keywords: ['rpc', 'horizon', 'api', 'datos', 'data', 'consultar', 'indexer'],
    facts:
      'Apps read and write Stellar data through two APIs. Stellar RPC supports smart contracts and transaction simulation. Horizon gives curated, parsed data about accounts, payments and assets. Neither is meant for full history; use Hubble or Galexie for that.',
    url: `${DOCS}/data/apis`,
  },
]

export function getKnowledge(ids: string[]): KnowledgeEntry[] {
  return KNOWLEDGE.filter((entry) => ids.includes(entry.id))
}

export function findRelevantKnowledge(question: string, limit = 3): KnowledgeEntry[] {
  const text = normalize(question)
  return KNOWLEDGE.map((entry) => ({ entry, score: scoreEntry(entry, text) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ entry }) => entry)
}

function scoreEntry(entry: KnowledgeEntry, text: string): number {
  return entry.keywords.reduce((score, keyword) => (text.includes(normalize(keyword)) ? score + keyword.length : score), 0)
}

function normalize(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}
