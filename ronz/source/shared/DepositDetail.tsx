import { Link } from "react-router";
import { useClaim } from "@hooks/useClaim";
import { useDeposit } from "@hooks/useDeposit";
import { useNow } from "@hooks/useNow";
import { buttonClass, cardClass } from "@helpers/classes";
import { friendlyError } from "@helpers/friendlyError";
import DepositCard from "./DepositCard";
import { Alert, Button } from "./primitives";

type DepositDetailProps = { address: string; id: string; onClaimed: () => void };

export default function DepositDetail({ address, id, onClaimed }: DepositDetailProps) {
  const now = useNow();
  const { deposit, error, loading, retry } = useDeposit(address, id);
  const { claim, claimingId, failure, claimedIds } = useClaim(address, onClaimed);

  if (loading) return <div className="h-48 animate-pulse rounded-2xl bg-raised motion-reduce:animate-none" />;

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <Alert>{friendlyError(error)}</Alert>
        <Button variant="ghost" onClick={retry}>
          Reintentar
        </Button>
      </div>
    );
  }

  if (!deposit) {
    return (
      <section className={`${cardClass()} flex flex-col items-start gap-4`} aria-label="Depósito no encontrado">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">No encontramos este depósito</h3>
          <p className="text-sm text-muted">
            Puede que ya haya sido reclamado, que el link esté incompleto o que hayas conectado otra cuenta. Verifica
            que sea la cuenta del arrendador o la del inquilino.
          </p>
        </div>
        <Link to="/depositos" className={buttonClass({ variant: "ghost" })}>
          Ir a mis depósitos
        </Link>
      </section>
    );
  }

  return (
    <DepositCard
      deposit={deposit}
      now={now}
      claimed={claimedIds.has(deposit.id)}
      claiming={claimingId === deposit.id}
      error={failure?.id === deposit.id ? failure.error : null}
      onClaim={() => void claim(deposit.id)}
    />
  );
}
