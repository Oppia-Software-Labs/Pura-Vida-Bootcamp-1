type ConnectButtonProps = {
  onConnect: () => void
}

export default function ConnectButton({ onConnect }: ConnectButtonProps) {
  return (
    <button type="button" className="btn-solid-lg" onClick={onConnect}>
      Conectar wallet
    </button>
  )
}
