# ChessRegistry (contrato Soroban)

Contrato que registra en Stellar el hash de una partida de ajedrez junto con su autor, nombres y resultado.

**Contract ID (testnet):** `CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3`

**Contract ID con oráculo (testnet):** `CBX75GYJ365XIGF5IMKIQOM6CNGWYMZWSMHNMYCSU4DRLXJP3AG7QIZU` ([Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBX75GYJ365XIGF5IMKIQOM6CNGWYMZWSMHNMYCSU4DRLXJP3AG7QIZU)). Admin: `GBNXEZ4TZ6MYIPRUKTCQRH4HKPLJV2PHMNGTQSHRYIPGX2C3AXKTNMPH`. Todavía no hay atestadores habilitados.

> La app usa este contrato. El de arriba (sin oráculo) queda solo como historial.

## Funciones

- `__constructor(admin)`: se ejecuta en el deploy y fija la cuenta admin.
- `register_game(...)`: registro simple. Requiere la firma del autor.
- `register_attested_game(registrar, hash, white, black, result, attester, signature)`: registro con oráculo. Requiere la firma del autor **y** una firma ed25519 de un atestador habilitado (ver abajo).
- `get_game(hash)`: devuelve la partida registrada para ese hash.
- `games_by(author)`: lista las partidas registradas por una cuenta.
- `get_attestation(hash)`: clave pública del atestador que firmó la partida (`None` si fue un registro simple).
- `is_attester(pubkey)`, `admin()`: lectura del estado de administración.
- `add_attester(pubkey)`, `remove_attester(pubkey)`, `set_admin(addr)`: solo admin. Permiten rotar o revocar claves.

## Atestación (oráculo)

El atestador firma con ed25519 este mensaje (bytes concatenados):

```
"chess-registry:attest:v1" || XDR(Address contrato) || XDR(Address registrar) || pgn_hash (32B) || result (u32 BE)
```

- El **contrato** va en el mensaje: una firma no sirve en otro deploy ni en otra red.
- El **registrar** va en el mensaje: si alguien copia la firma desde la mempool, no puede registrarla a su nombre (anti front-running).
- El **resultado** va en el mensaje: no se puede cambiar 1-0 por 0-1.
- Los nombres **no** van firmados: el atestador no puede verificarlos.
- Si la firma es inválida, la transacción aborta (panic del host). Si la clave no está habilitada, devuelve `UnknownAttester`.

Firmador de referencia: `vision-bridge/vision_bridge/attest.py`. Un test cruzado (`attested_golden_vector_from_python`) asegura que Python y Rust construyen el mismo mensaje.

## Errores

| Código | Nombre | Cuándo |
|---|---|---|
| 1 | `AlreadyRegistered` | El hash ya fue registrado |
| 2 | `InvalidResult` | El resultado no es 0, 1 ni 2 |
| 3 | `UnknownAttester` | La clave del atestador no está habilitada (o fue revocada) |

## Resultado

`0` = 1-0, `1` = 0-1, `2` = ½-½

## Comandos

```bash
cargo test
stellar contract build
stellar contract deploy --wasm target/wasm32v1-none/release/chess_registry.wasm --source <tu-cuenta> --network testnet -- --admin <G...admin>

# habilitar un atestador (pubkey cruda en hex, 32 bytes)
stellar contract invoke --id <C...> --source <admin> --network testnet -- add_attester --attester <hex>
```

## Política de TTL

Cada escritura extiende el TTL de las entradas afectadas (~29 días). Si una entrada no se vuelve a escribir, puede expirar.
