import { StarMark } from './OrbitMark'
import { useLanguage } from '../i18n/useLanguage'

const items = [
  { id: 'overview', key: 'overview', index: '01' },
  { id: 'goals', key: 'goals', index: '02' },
  { id: 'activity', key: 'activity', index: '03' },
]

export function Sidebar({ active, onNavigate }) {
  const { t } = useLanguage()

  return (
    <aside className="sidebar">
      <p className="brand">
        <StarMark className="brand__star" />
        <span className="brand__name">
          <span>Stellar</span>
          <span>Savings</span>
        </span>
      </p>
      <nav className="sidebar__nav" aria-label={t.navLabel}>
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={active === item.id ? 'nav-link is-active' : 'nav-link'}
            aria-current={active === item.id ? 'true' : undefined}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-link__index">/{item.index}</span>
            <span>{t.nav[item.key]}</span>
          </button>
        ))}
      </nav>
    </aside>
  )
}
