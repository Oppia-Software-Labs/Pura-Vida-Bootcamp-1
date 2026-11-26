import { useSyncExternalStore } from 'react'

const preference = typeof window === 'undefined'
  ? null
  : window.matchMedia('(prefers-reduced-motion: reduce)')

function subscribe(notify: () => void) {
  preference?.addEventListener('change', notify)
  return () => preference?.removeEventListener('change', notify)
}

// Subscribe directly so a system preference change also stops the WebGL loop.
export function useMotionPreference() {
  return useSyncExternalStore(subscribe, () => preference?.matches ?? false, () => true)
}
