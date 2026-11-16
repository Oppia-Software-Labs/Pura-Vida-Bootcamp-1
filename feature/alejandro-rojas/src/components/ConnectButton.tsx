type ConnectButtonProps = {
  onConnect: () => void
}

export default function ConnectButton({ onConnect }: ConnectButtonProps) {
  return (
    <button type="button" className="counter" onClick={onConnect}>
      Conectar wallet
    </button>
  )
}
