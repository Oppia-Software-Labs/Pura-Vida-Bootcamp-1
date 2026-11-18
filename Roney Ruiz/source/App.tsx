import { useWallet } from "@hooks/useWallet";
import ConnectWallet from "@shared/ConnectWallet";
import CreateDeposit from "@shared/CreateDeposit";

export default function App() {
  const wallet = useWallet();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 p-6">
      <h1 className="text-2xl font-bold">Plazo</h1>
      <ConnectWallet wallet={wallet} />
      {wallet.address && <CreateDeposit address={wallet.address} />}
    </main>
  );
}
