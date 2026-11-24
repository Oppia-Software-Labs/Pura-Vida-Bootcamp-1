import { useAppContext } from "@hooks/useAppContext";
import MyDeposits from "@shared/MyDeposits";
import PageHeader from "@shared/PageHeader";
import RequireWallet from "@shared/RequireWallet";

export default function DepositsPage() {
  const { depositsKey, refreshBalance, refreshDeposits } = useAppContext();

  function handleRefresh() {
    refreshBalance();
    refreshDeposits();
  }

  return (
    <>
      <PageHeader title="Mis depósitos" description="Los que creaste y los que te asignaron, con su estado en vivo." />
      <RequireWallet message="Conecta tu wallet para ver los depósitos de tu cuenta.">
        {(address) => (
          <MyDeposits address={address} refreshKey={depositsKey} onRefresh={handleRefresh} onClaimed={refreshBalance} />
        )}
      </RequireWallet>
    </>
  );
}
