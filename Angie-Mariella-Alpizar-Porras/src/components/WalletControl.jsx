import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import { abbreviateAddress } from '../wallet/network'

function modalNotice(wallet, t) {
  if (wallet.phase === 'connecting') return t.walletConnecting
  if (wallet.phase === 'missing') return `${t.walletMissing}. ${t.walletInstallHint}`
  if (wallet.phase === 'rejected') return t.walletRejected
  if (wallet.phase === 'error') return t.walletError
  if (wallet.phase === 'ready' && !wallet.testnet) {
    return `${t.walletWrongNetwork}. ${t.walletWrongNetworkHint}`
  }
  return ''
}

export function WalletControl({ wallet, onConnect, onDisconnect }) {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)
  const dialogRef = useRef(null)
  const choiceRef = useRef(null)
  const titleId = useId()
  const hintId = useId()
  const noticeId = useId()
  const busy = wallet.phase === 'checking' || wallet.phase === 'connecting'
  const notice = modalNotice(wallet, t)

  useEffect(() => {
    if (wallet.phase === 'ready' && wallet.testnet && dialogRef.current?.open) {
      dialogRef.current.close()
    }
  }, [wallet.phase, wallet.testnet])

  useEffect(() => {
    function onKeyDown(event) {
      if (event.key !== 'Escape' || !dialogRef.current?.open) return
      event.preventDefault()
      dialogRef.current.close()
    }

    window.addEventListener('keydown', onKeyDown, true)
    return () => window.removeEventListener('keydown', onKeyDown, true)
  }, [])

  function openModal() {
    const node = dialogRef.current
    if (node && !node.open) node.showModal()
    choiceRef.current?.focus()
  }

  function closeModal() {
    if (dialogRef.current?.open) dialogRef.current.close()
  }

  function dismissOnBackdrop(event) {
    const node = dialogRef.current
    if (!node) return
    const rect = node.getBoundingClientRect()
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom
    if (!inside) node.close()
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      setCopied(false)
    }
  }

  return (
    <>
      {wallet.phase === 'ready' && wallet.address ? (
        <div className="wallet">
          <p className="wallet__address" title={wallet.address}>
            {abbreviateAddress(wallet.address)}
          </p>
          <button type="button" className="btn" onClick={copyAddress}>
            {copied ? t.walletCopied : t.walletCopy}
          </button>
          <button type="button" className="btn" onClick={onDisconnect}>
            {t.walletDisconnect}
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn--solid" onClick={openModal} disabled={busy}>
          {wallet.phase === 'connecting' ? t.walletConnecting : t.connect}
        </button>
      )}
      <dialog
        ref={dialogRef}
        className="goal-dialog wallet-dialog"
        aria-labelledby={titleId}
        aria-describedby={notice ? `${hintId} ${noticeId}` : hintId}
        aria-busy={wallet.phase === 'connecting'}
        onClick={dismissOnBackdrop}
      >
        <div className="goal-form__head">
          <h3 id={titleId}>{t.walletModalTitle}</h3>
          <button type="button" className="btn wallet-modal__close" onClick={closeModal} aria-label={t.close}>
            X
          </button>
        </div>
        <p id={hintId} className="wallet-modal__hint">
          {t.walletModalHint}
        </p>
        <button
          ref={choiceRef}
          type="button"
          className="wallet-choice"
          onClick={onConnect}
          disabled={wallet.phase === 'connecting'}
        >
          <span className="wallet-choice__mark" aria-hidden="true" />
          {wallet.phase === 'connecting' ? t.walletConnecting : t.walletChoice}
        </button>
        {notice ? (
          <p id={noticeId} className="wallet-modal__status" role="status">
            {notice}
          </p>
        ) : null}
      </dialog>
    </>
  )
}
