import { useEffect, useState } from 'react'

export function useActiveSection(ids: string[], enabled: boolean): number {
  const [active, setActive] = useState(-1)

  useEffect(() => {
    if (!enabled) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting)
        if (visible.length === 0) return
        setActive(ids.indexOf(visible[0].target.id))
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    ids.forEach((id) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })
    return () => observer.disconnect()
  }, [ids, enabled])

  return active
}
