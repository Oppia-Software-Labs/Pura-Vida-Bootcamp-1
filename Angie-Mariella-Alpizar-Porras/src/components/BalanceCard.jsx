import { SpaceField } from './OrbitMark'
import { useLanguage } from '../i18n/useLanguage'
import { formatNativeBalance } from '../wallet/balance'
import { abbreviateAddress } from '../wallet/network'

function statusText(wallet, t) {
  if (wallet.phase === 'checking') return t.walletChecking
  if (wallet.phase === 'connecting') return t.walletConnecting
  if (wallet.phase === 'missing') return t.walletMissing
  if (wallet.phase === 'rejected') return t.walletRejected
  if (wallet.phase === 'error') return t.walletError
  if (wallet.phase === 'ready' && !wallet.testnet) return t.walletWrongNetwork
  if (wallet.phase === 'ready') return `${t.walletConnected} ${abbreviateAddress(wallet.address)}`
  if (wallet.notice === 'local') return t.walletDisconnectNote
  return t.walletStatus
}

function balanceNotice(balance, t) {
  if (balance.status === 'loading') return t.balanceLoading
  if (balance.status === 'unfunded') return t.balanceUnfunded
  if (balance.status === 'invalid') return t.balanceInvalid
  if (balance.status === 'error') return t.balanceError
  return ''
}

export function BalanceCard({ wallet, balance }) {
  const { t, lang } = useLanguage()
  const wrongNetwork = wallet.phase === 'ready' && !wallet.testnet
  const current = balance.address === wallet.address && wallet.phase === 'ready' && wallet.testnet
  const amount = current && balance.status === 'ready' ? formatNativeBalance(balance.amount, lang) : ''
  const notice = current ? balanceNotice(balance, t) : ''

  return (
    <section className="balance" aria-labelledby="balance-label">
      <div className="balance__copy">
        <p id="balance-label" className="kicker">
          {t.balanceLabel}
        </p>
        <p className="balance__amount" aria-label={amount ? `${amount.text} XLM` : undefined}>
          <span className="balance__whole">{amount ? amount.whole : t.balanceEmpty}</span>
          {amount?.fraction ? <span className="balance__fraction">{amount.fraction}</span> : null}
          <span className="balance__unit">XLM</span>
        </p>
        <p className="balance__status" role="status">
          {statusText(wallet, t)}
        </p>
        {notice ? (
          <p className="balance__warn" role="status">
            {notice}
          </p>
        ) : null}
        {amount ? <p className="balance__note">{t.balanceNote}</p> : null}
        {current ? (
          <button
            type="button"
            className="btn balance__refresh"
            onClick={balance.refresh}
            disabled={balance.status === 'loading'}
          >
            {t.balanceRefresh}
          </button>
        ) : null}
        {wrongNetwork ? <p className="balance__warn">{t.walletWrongNetworkHint}</p> : null}
        {wallet.phase === 'missing' ? <p className="balance__warn">{t.walletInstallHint}</p> : null}
      </div>
      <div className="balance__field">
        <SpaceField className="space-field" />
      </div>
    </section>
  )
}
