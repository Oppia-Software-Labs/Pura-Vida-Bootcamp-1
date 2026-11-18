import { Navigate, useParams } from "react-router";
import { useAppContext } from "@hooks/useAppContext";
import DepositDetail from "@shared/DepositDetail";
import PageHeader from "@shared/PageHeader";
import RequireWallet from "@shared/RequireWallet";

export default function DepositDetailPage() {
  const { id } = useParams();
  const { refreshBalance } = useAppContext();

  if (!id) return <Navigate to="/depositos" replace />;

  return (
    <>
      <PageHeader
        back={{ to: "/depositos", label: "Mis depósitos" }}
        title="Depósito"
        description="Aquí ves el estado de este depósito y puedes reclamarlo cuando te toque."
      />
      <RequireWallet message="Conecta la cuenta del arrendador o del inquilino para ver este depósito.">
        {(address) => <DepositDetail address={address} id={id} onClaimed={refreshBalance} />}
      </RequireWallet>
    </>
  );
}
