interface Props {
  pending: number
  synced: number
  syncing: boolean
  onSync: () => void
}

/** Contadores + botón "Simular reconexión" (MOCK: espera 1.5 s y marca todo como sincronizado). */
export default function SyncBar({ pending, synced, syncing, onSync }: Props) {
  return (
    <div className="syncbar">
      <button className="btn-primary" onClick={onSync} disabled={syncing || pending === 0}>
        {syncing ? 'Sincronizando…' : 'Simular reconexión'}
      </button>
      <div className="counters">
        <span className="counter pending">{pending} {pending === 1 ? 'pago pendiente' : 'pagos pendientes'}</span>
        <span className="counter synced">{synced} {synced === 1 ? 'pago sincronizado' : 'pagos sincronizados'}</span>
      </div>
      {syncing && (
        <div className="syncing" role="status">
          <span className="spinner" aria-hidden="true" /> Sincronizando con Stellar...
        </div>
      )}
    </div>
  )
}
