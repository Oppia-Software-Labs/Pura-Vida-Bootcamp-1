# Arquitectura de Proofolio

## Alcance

Proofolio es una SPA bilingüe servida por Vite y una única instancia de contrato Soroban en Stellar Testnet. No usa backend, base de datos, GitHub OAuth, Mainnet ni fondos reales.

```text
Varial wallet
     |
     | firma XDR simulado
     v
React + TypeScript ---- API pública de GitHub
     |
     | JSON-RPC
     v
Contrato Proofolio en Stellar Testnet
```

GitHub se consulta fuera de cadena para comprobar que la URL corresponde a un Pull Request público fusionado. Soroban conserva únicamente el reconocimiento firmado y los datos mínimos necesarios para consultar el perfil.

## Contrato público

```rust
enum ContributionKind { Code, Docs, Design, Testing, Other }

struct Attestation {
    id: u64,
    issuer: Address,
    recipient: Address,
    repo: String,
    pr_number: u32,
    kind: ContributionKind,
    issued_at: u64,
}

issue(issuer, recipient, repo, pr_number, kind) -> u64
get(id) -> Attestation
list_for(recipient) -> Vec<Attestation>
```

### Invariantes

- `issuer.require_auth()` protege cada emisión.
- Emisor y receptor deben ser diferentes.
- La pareja emisor/receptor no puede registrar dos veces el mismo repositorio y número de PR.
- Cada receptor puede conservar como máximo 50 registros.
- Los registros son inmutables y no existe función administrativa ni de borrado.
- Attestations, índices y llaves de duplicados usan almacenamiento persistente con extensión explícita de TTL.
- Cada emisión publica un evento con el identificador y las partes involucradas.

## Flujo de emisión

1. La persona conecta Varial y la aplicación confirma Testnet.
2. La interfaz analiza la URL de GitHub y consulta el endpoint público del PR.
3. El formulario exige `merged_at` y muestra repositorio, título, autor y fecha.
4. La app construye la llamada `issue` con la dirección conectada como emisor.
5. El RPC simula la transacción antes de abrir la firma.
6. Varial firma el XDR preparado y el RPC lo envía.
7. La UI espera confirmación y vuelve a consultar el perfil receptor.

## Límites conscientes

GitHub valida el estado del PR en el navegador, por lo que el contrato no puede garantizar que la evidencia siga disponible ni que la wallet pertenezca al autor. La interfaz usa “firmado por” y muestra la dirección emisora. Testnet puede reiniciarse; el Contract ID se trata como configuración reemplazable.
