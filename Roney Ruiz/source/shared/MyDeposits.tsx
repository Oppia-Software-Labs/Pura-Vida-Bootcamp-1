import { Link } from "react-router";
import { useClaim } from "@hooks/useClaim";
import { useDeposits } from "@hooks/useDeposits";
import { useNow } from "@hooks/useNow";
import { buttonClass } from "@helpers/classes";
import { friendlyError } from "@helpers/friendlyError";
import DepositCard from "./DepositCard";
import { Alert, Button } from "./primitives";

type MyDepositsProps = { address: string; refreshKey: number; onRefresh: () => void; onClaimed: () => void };

export default function MyDeposits({ address, refreshKey, onRefresh, onClaimed }: MyDepositsProps) {
  const now = useNow();
  const { deposits, partial, error, loading } = useDeposits(address, refreshKey);
  const { claim, claimingId, failure, claimedIds } = useClaim(address, onClaimed);

  return (
    <section className="flex flex-col gap-4" aria-label="Mis depósitos">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {loading ? "Buscando tus depósitos..." : `${deposits.length} ${deposits.length === 1 ? "depósito" : "depósitos"}`}
        </p>
        <Button variant="ghost" size="sm" onClick={onRefresh} disabled={loading}>
          Actualizar
        </Button>
      </div>

      {partial && (
        <p className="rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-sm text-warn">
          No pudimos listar todos tus depósitos. Mostramos los que conocemos por su link.
        </p>
      )}

      {loading && <div className="h-40 animate-pulse rounded-xl bg-raised motion-reduce:animate-none" />}

      {error && (
        <div className="flex flex-col items-start gap-3">
          <Alert>{friendlyError(error)}</Alert>
          <Button variant="ghost" onClick={onRefresh}>
            Reintentar
          </Button>
        </div>
      )}

      {!loading && !error && deposits.length === 0 && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-line-strong px-4 py-10 text-center">
          <p className="max-w-sm text-sm text-muted">
            Aún no tienes depósitos. Crea el primero, o abre el link que te compartió el inquilino.
          </p>
          <Link to="/crear" className={buttonClass()}>
            Crear mi primer depósito
          </Link>
        </div>
      )}

      {deposits.map((deposit) => (
        <DepositCard
          key={deposit.id}
          deposit={deposit}
          now={now}
          claimed={claimedIds.has(deposit.id)}
          claiming={claimingId === deposit.id}
          error={failure?.id === deposit.id ? failure.error : null}
          onClaim={() => void claim(deposit.id)}
        />
      ))}
    </section>
  );
}
