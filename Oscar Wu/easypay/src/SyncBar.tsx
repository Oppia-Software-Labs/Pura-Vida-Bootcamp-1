import CountUp from './CountUp'

interface Props {
  totalCrc: number
  pending: number
  synced: number
}

/** Resumen del día: total cobrado, por sincronizar y ya en Stellar. */
export default function SyncBar({ totalCrc, pending, synced }: Props) {
  return (
    <div className="syncbar">
      <div className="counters">
        <div className="counter total">
          <b>₡<CountUp value={totalCrc} duration={800} /></b>
          <span>cobrado hoy</span>
        </div>
        <div className="counter pending">
          <b><CountUp value={pending} duration={600} /></b>
          <span>por sincronizar</span>
        </div>
        <div className="counter synced">
          <b><CountUp value={synced} duration={600} /></b>
          <span>en Stellar</span>
        </div>
      </div>
    </div>
  )
}
