import { useLanguage } from '../i18n/useLanguage'

export function ActivitySection() {
  const { t } = useLanguage()

  return (
    <section className="activity" id="activity" aria-labelledby="activity-title">
      <p className="kicker">/03</p>
      <h2 id="activity-title">{t.activityTitle}</h2>
      <p className="activity__empty">{t.activityEmpty}</p>
      <p className="activity__hint">{t.activityHint}</p>
    </section>
  )
}
