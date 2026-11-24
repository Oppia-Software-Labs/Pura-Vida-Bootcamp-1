import { useAppContext } from "@hooks/useAppContext";
import CreateDeposit from "@shared/CreateDeposit";
import PageHeader from "@shared/PageHeader";
import RequireWallet from "@shared/RequireWallet";

export default function CreateDepositPage() {
  const { balanceKey, refreshBalance, refreshDeposits } = useAppContext();

  function handleCreated() {
    refreshBalance();
    refreshDeposits();
  }

  return (
    <>
      <PageHeader
        title="Crear depósito"
        description="Bloquea el monto en la red. Tú lo recuperas si el arrendador no actúa a tiempo."
      />
      <RequireWallet message="Necesitas tu wallet para firmar la creación del depósito.">
        {(address) => <CreateDeposit address={address} refreshKey={balanceKey} onCreated={handleCreated} />}
      </RequireWallet>
    </>
  );
}
