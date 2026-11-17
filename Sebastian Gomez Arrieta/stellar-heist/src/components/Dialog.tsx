import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

interface DialogProps {
  open: boolean
  paused: boolean
  onClose: () => void
  labelId: string
  children: ReactNode
  afterClose?: () => void
}

export function Dialog({ open, paused, onClose, labelId, children, afterClose }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const previousOverflow = useRef<string | null>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    let animation: Animation | undefined
    const restoreScroll = () => {
      if (previousOverflow.current !== null) {
        document.body.style.overflow = previousOverflow.current
        previousOverflow.current = null
      }
    }
    if (open) {
      if (previousOverflow.current === null) previousOverflow.current = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      if (!dialog.open) dialog.showModal()
      animation = dialog.animate([
        { opacity: 0, transform: 'perspective(1200px) translateY(70px) rotateX(14deg) scale(0.85)', filter: 'blur(12px)' },
        { opacity: 1, transform: 'perspective(1200px) translateY(0) rotateX(0) scale(1)', filter: 'blur(0px)' },
      ], { duration: paused ? 0 : 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
    } else if (dialog.open) {
      animation = dialog.animate([
        { opacity: 1, transform: 'perspective(1200px) translateY(0) scale(1)' },
        { opacity: 0, transform: 'perspective(1200px) translateY(-25px) scale(0.94)' },
      ], { duration: paused ? 0 : 220, easing: 'ease-in', fill: 'forwards' })
      void animation.finished.then(() => { dialog.close(); restoreScroll() }).catch(() => {})
    }
    return () => animation?.cancel()
  }, [open, paused])

  useEffect(() => {
    const dialog = ref.current
    return () => {
      dialog?.close()
      if (previousOverflow.current !== null) document.body.style.overflow = previousOverflow.current
      previousOverflow.current = null
    }
  }, [])

  return <dialog ref={ref} className="mission-dialog" aria-labelledby={labelId}
    onKeyDown={(event) => {
      if (event.key !== 'Tab') return
      const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (!first || !last) return
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }}
    onCancel={(event) => { event.preventDefault(); onClose() }}
    onClose={() => afterClose?.()}
    onClick={(event) => {
      if (event.target !== ref.current) return
      const bounds = event.currentTarget.getBoundingClientRect()
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose()
    }}>
    {children}
  </dialog>
}
