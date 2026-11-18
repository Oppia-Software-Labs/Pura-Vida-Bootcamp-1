import { useClaim } from "@hooks/useClaim";
import { useDeposits } from "@hooks/useDeposits";
import { useNow } from "@hooks/useNow";
import { readSharedDepositId } from "@bloc/storage/deposits";
import { cardClass } from "./classes";
import DepositCard from "./DepositCard";
import { friendlyError } from "./friendlyError";
import { Alert, Button } from "./primitives";

type MyDepositsProps = { address: string; refreshKey: number; onChanged: () => void };

export default function MyDeposits({ address, refreshKey, onChanged }: MyDepositsProps) {
  const now = useNow();
  const { deposits, partial, error, loading } = useDeposits(address, refreshKey);
  const { claim, claimingId, failure, claimedIds } = useClaim(address, onChanged);
  const sharedId = readSharedDepositId();
  const sharedMissing = !loading && !error && sharedId !== null && !deposits.some((deposit) => deposit.id === sharedId);

  return (
    <section className={`${cardClass()} flex flex-col gap-5`} aria-label="Mis depósitos">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Mis depósitos</h2>
          <p className="text-sm text-muted">Los que creaste y los que te asignaron.</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onChanged} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {sharedMissing && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          No encontramos el depósito del link entre los de tu cuenta. Verifica que conectaste la cuenta del arrendador
          o la del inquilino.
        </p>
      )}

      {partial && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          No pudimos listar todos tus depósitos. Mostramos los que conocemos por su link.
        </p>
      )}

      {loading && <div className="h-40 animate-pulse rounded-xl bg-raised motion-reduce:animate-none" />}

      {error && (
        <div className="flex flex-col items-start gap-3">
          <Alert>{friendlyError(error)}</Alert>
          <Button variant="ghost" onClick={onChanged}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && deposits.length === 0 && (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-muted">
          Aún no tienes depósitos. Crea el primero, o abre el link que te compartió el inquilino.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {deposits.map((deposit) => (
          <DepositCard
            key={deposit.id}
            deposit={deposit}
            now={now}
            claimed={claimedIds.has(deposit.id)}
            claiming={claimingId === deposit.id}
            error={failure?.id === deposit.id ? failure.error : null}
            highlighted={deposit.id === sharedId}
            onClaim={() => void claim(deposit.id)}
          />
        ))}
      </div>
    </section>
  );
}
