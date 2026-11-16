import type { PersonaId } from './personas'

export type Concept = {
  id: string
  emoji: string
  title: string
  analogy: string
  drawing: string
  stories: Record<PersonaId, string>
  code?: string
  docs: { label: string; url: string }
}

const DOCS = 'https://developers.stellar.org/docs'

export const CONCEPTS: Concept[] = [
  {
    id: 'testnet',
    emoji: '🧸',
    title: 'Testnet',
    analogy: 'Jugar de tiendita con billetes de Monopoly',
    drawing: String.raw`
   MAINNET            TESTNET
  +--------+        +--------+
  | $ real |        | $ juego|
  | cuidado|        | ¡dale! |
  +--------+        +--------+
                       ^
            el abuelo Friendbot
            regala billetes aquí`,
    stories: {
      abuelita:
        '¿Se acuerda cuando jugaba de tiendita con billetes de Monopoly? Testnet es eso: una copia de Stellar donde todo funciona igualito, pero la plata es de juguete. Y hay un abuelo buena gente, Friendbot, que le regala billetes para jugar. Así uno aprende sin miedo a perder ni un cinco.',
      rapero:
        'Testnet es el ensayo antes del show,\nla plata es de juguete, nadie pierde un peso, bro.\nFriendbot te tira lumens pa que empecés a jugar,\nequivocate tranquilo, que aquí se viene a practicar.',
      ingeniera:
        'Testnet es una red pública separada de mainnet, con su propio passphrase y su propio Horizon/RPC. Friendbot fondea cuentas nuevas con XLM sin valor. Se resetea de vez en cuando, así que no guardes nada importante ahí. Es tu staging.',
    },
    code: `fetch('https://friendbot.stellar.org?addr=' + publicKey)`,
    docs: { label: 'Faucet (Friendbot)', url: `${DOCS}/tools/quickstart/faucet` },
  },
  {
    id: 'wallet',
    emoji: '👛',
    title: 'Wallet y llaves',
    analogy: 'Un monedero con candado',
    drawing: String.raw`
     .-------------.
     |  G...ABCD   |  <- dirección pública
     |  (monedero) |     todos la pueden ver
     '------.------'
            |
          [ o-]       <- llave secreta S...
                         solo vos la tenés`,
    stories: {
      abuelita:
        'Una wallet es como su monedero con candado. La dirección, que empieza con G, es como el número de su casa: se la puede dar a cualquiera para que le manden plata. La llave secreta, que empieza con S, es la única llave del candado. Si la pierde, nadie le puede hacer otra; y si se la da a alguien, ese alguien se lleva todo. Ah, y el monedero tiene que tener al menos 1 XLM adentro para existir.',
      rapero:
        'Tu dirección con G, la podés gritar en la calle,\ntu llave con S, esa nunca la regalés, no falle.\nSi la perdés, se acabó, no hay cerrajero,\nun lumen mínimo adentro pa que exista tu monedero.',
      ingeniera:
        'Una cuenta Stellar es un keypair ed25519: la public key (G…) identifica la cuenta y la secret key (S…) firma transacciones. Una wallet como Freighter/Varial guarda la secret y solo te devuelve firmas. La cuenta existe en el ledger cuando tiene el balance mínimo: 2 base reserves (hoy 1 XLM).',
    },
    code: `const { address } = await StellarWalletsKit.authModal()`,
    docs: { label: 'Accounts', url: `${DOCS}/learn/fundamentals/stellar-data-structures/accounts` },
  },
  {
    id: 'transaccion',
    emoji: '📲',
    title: 'Transacción',
    analogy: 'Un SINPE Móvil',
    drawing: String.raw`
   [ Vos ]  --- 5 XLM --->  [ Doña Rosa ]
      |
      +-- firmás con tu llave
      +-- la red lo anota en el
          cuaderno (ledger) en ~5 s`,
    stories: {
      abuelita:
        'Es como hacer un SINPE Móvil: usted dice a quién, cuánto, y lo autoriza con su clave. En unos 5 segundos queda anotado en un cuaderno gigante que todo el mundo puede revisar y que nadie puede borrar. Ese cuaderno se llama ledger.',
      rapero:
        'Quién, cuánto y tu firma, ya está el combo,\nen cinco segundos queda escrito, sin rollo.\nEl ledger es el cuaderno que nadie puede borrar,\nlo que mandaste ahí se queda pa contar.',
      ingeniera:
        'Una transacción agrupa una o más operaciones (payment, changeTrust, invokeHostFunction…), lleva el sequence number de la cuenta y la firma de la secret key. Se envía a la red y, si se valida, queda en el siguiente ledger (~5 s). Es atómica: o se aplican todas las operaciones o ninguna.',
    },
    code: `new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
  .addOperation(Operation.payment({ destination, asset: Asset.native(), amount: '5' }))
  .setTimeout(180)
  .build()`,
    docs: { label: 'Send and receive payments', url: `${DOCS}/build/guides/transactions/send-and-receive-payments` },
  },
  {
    id: 'fee',
    emoji: '🚌',
    title: 'Fee (comisión)',
    analogy: 'El pasaje del bus',
    drawing: String.raw`
   +--------------------+
   |  BUS STELLAR       |
   |  pasaje: 0.00001   |
   |  XLM por operación |
   +--------------------+
     o              o`,
    stories: {
      abuelita:
        'Es como el pasaje del bus: cada vez que se sube, paga. Pero este pasaje es chiquitititito, como 0.00001 XLM, menos que una moneda de cinco. Sirve para que nadie llene el bus de gente de mentira y todos puedan viajar.',
      rapero:
        'Cada viaje paga pasaje, así es la vuelta,\ncien stroops nada más, la billetera ni se inquieta.\nEs pa que nadie haga spam y trabe la ruta,\nbarato y parejo, así la red disfruta.',
      ingeniera:
        'El base fee mínimo es 100 stroops (0.00001 XLM) por operación. Es una puja: si la red está congestionada podés ofrecer más para entrar primero. Los contratos (Soroban) además pagan un resource fee por CPU, lecturas/escrituras y almacenamiento.',
    },
    code: `fee: BASE_FEE // '100' stroops por operación`,
    docs: { label: 'Fees, resource limits and metering', url: `${DOCS}/learn/fundamentals/fees-resource-limits-metering` },
  },
  {
    id: 'token',
    emoji: '🎟️',
    title: 'Asset / Token',
    analogy: 'Los vales de la pulpería',
    drawing: String.raw`
   +---------------------------+
   |  VALE  - Pulpería Chepe   |
   |  Vale por: 1 CHEPE        |
   |  Emitido por: G...CHEPE   |
   +---------------------------+`,
    stories: {
      abuelita:
        '¿Se acuerda de los vales que daba la pulpería? Un token es eso: un vale digital que emite alguien, por ejemplo Don Chepe. El vale vale lo que Don Chepe respalde: puede ser un colón, un dólar, o un kilo de café. En Stellar, a quien emite el vale se le dice "issuer". El XLM es el único que no tiene issuer: es la moneda de la casa.',
      rapero:
        'Un token es un vale con nombre y dueño,\nlo emite el issuer, ese es el del sueño.\nDólar, colón o café, lo que quiera respaldar,\nel XLM es de la casa, ese no hay que emitir ni firmar.',
      ingeniera:
        'Un asset clásico se identifica por código + cuenta emisora (p.ej. USDC:G…). No hay operación de "crear asset": nace cuando el issuer hace un payment de ese asset. XLM es el asset nativo. Cada asset clásico también tiene un Stellar Asset Contract (SAC) para usarlo desde smart contracts.',
    },
    code: `const chepe = new Asset('CHEPE', issuerPublicKey)`,
    docs: { label: 'Assets', url: `${DOCS}/learn/fundamentals/stellar-data-structures/assets` },
  },
  {
    id: 'trustline',
    emoji: '🤝',
    title: 'Trustline',
    analogy: '"Yo sí acepto vales de Don Chepe"',
    drawing: String.raw`
   [ Vos ] ---- confío en ----> [ Pulpería Chepe ]
      |
      +-- sin trustline:  ✗ no te pueden mandar CHEPE
      +-- con trustline:  ✓ ya podés recibir vales`,
    stories: {
      abuelita:
        'Antes de recibir vales de una pulpería, usted tiene que decir: "Yo sí confío en Don Chepe, acepto sus vales". Eso es una trustline. Así nadie le puede meter en el monedero vales de una pulpería que usted no conoce. Cada trustline aparta 0.5 XLM de su monedero, como un depósito.',
      rapero:
        'Antes de aceptar vales, decís "confío en ese compa",\nesa es la trustline, la firmás y no se rompe la trompa.\nNadie te mete basura que no pediste,\nmedio lumen de depósito y listo, ya existe.',
      ingeniera:
        'Una trustline (operación changeTrust) es una entrada en tu cuenta que te habilita a tener un asset clásico, con un límite opcional. Sin trustline, los payments de ese asset fallan. Cada trustline sube tu balance mínimo en 1 base reserve (0.5 XLM). El issuer puede exigir autorización.',
    },
    code: `Operation.changeTrust({ asset: chepe })`,
    docs: { label: 'Verify trustlines', url: `${DOCS}/build/guides/basics/verify-trustlines` },
  },
  {
    id: 'mint-burn',
    emoji: '🔥',
    title: 'Mint y Burn',
    analogy: 'Imprimir vales y romper los ya cambiados',
    drawing: String.raw`
   MINT                     BURN
   imprenta -> [VALE]       [VALE] -> 8<  ->  x x
   Don Chepe imprime        el vale vuelve a Chepe
   vales nuevos             y deja de existir`,
    stories: {
      abuelita:
        'Mint es cuando Don Chepe imprime vales nuevos y los reparte. Burn, o "quemar", es lo contrario: cuando el vale vuelve a la pulpería, Don Chepe lo rompe y ya no existe. Así nunca hay más vales circulando que la mercadería que él puede respaldar.',
      rapero:
        'Mint es la imprenta, salen vales calientes,\nburn es pa romperlos cuando vuelven de la gente.\nMenos vales en la calle, más valor en la mano,\nla oferta controlada, así se juega, hermano.',
      ingeniera:
        'Mint: el issuer hace un payment del asset → aumenta la oferta. Burn: el asset sale de circulación de dos formas: el holder lo devuelve a la cuenta emisora, o el issuer hace clawback (si el asset tiene AUTH_CLAWBACK_ENABLED). Con SAC/tokens Soroban existen mint() y burn() explícitos.',
    },
    code: `// burn = devolverle el asset al issuer
Operation.payment({ destination: issuerPublicKey, asset: chepe, amount: '10' })`,
    docs: { label: 'Glossary: Burn', url: `${DOCS}/learn/glossary#burn` },
  },
  {
    id: 'smart-contract',
    emoji: '🥤',
    title: 'Smart contract',
    analogy: 'Una máquina de refrescos',
    drawing: String.raw`
    +-----------+
    | REFRESCOS |
    |  [1] [2]  |   meto moneda + elijo
    |  [3] [4]  |   ---------------------> sale el refresco
    |  (o)  |_| |   sin dependiente, siempre igual
    +-----------+`,
    stories: {
      abuelita:
        'Un smart contract es como una máquina de refrescos: usted mete la moneda, escoge el botón y sale el refresco. No hay que convencer a ningún dependiente, la máquina siempre sigue las mismas reglas y nadie las puede cambiar a escondidas. En Stellar, esas máquinas se programan con algo llamado Soroban.',
      rapero:
        'Metés la moneda, apretás, sale el fresco,\nsin cajero que te diga "hoy no, que estoy fresco".\nReglas en código, nadie las cambia a escondidas,\nSoroban la máquina, contratos con medida.',
      ingeniera:
        'Los smart contracts en Stellar (Soroban) se escriben en Rust, se compilan a WebAssembly y se despliegan con un contract ID (C…). Se invocan con invokeHostFunction; primero se simulan para calcular recursos y luego se firman y envían. Desde JS, contract.Client te genera métodos tipados.',
    },
    code: `const client = await contract.Client.from({ contractId, rpcUrl, networkPassphrase, publicKey, signTransaction })
const tx = await client.increment()
await tx.signAndSend()`,
    docs: { label: 'Smart contracts', url: `${DOCS}/build/smart-contracts/overview` },
  },
]
