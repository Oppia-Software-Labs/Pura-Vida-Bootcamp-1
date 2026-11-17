import { useLanguage } from '../i18n/useLanguage'

const options = ['es', 'en']

export function LanguageSwitch() {
  const { lang, setLang, t } = useLanguage()

  return (
    <div className="lang" role="group" aria-label={t.langLabel}>
      {options.map((code) => (
        <button
          key={code}
          type="button"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}
