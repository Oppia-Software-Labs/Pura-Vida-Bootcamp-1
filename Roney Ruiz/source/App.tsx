import ConnectWallet from "@shared/ConnectWallet";

export default function App() {
  return (
    <main className="mx-auto max-w-xl p-6">
      <h1 className="mb-4 text-2xl font-bold">Plazo</h1>
      <ConnectWallet />
    </main>
  );
}
