import type { AiSettingsState } from '../hooks/useAiSettings'
import { PROVIDERS, type ProviderId } from '../lib/ai'

export function AiSettingsPanel({ ai }: { ai: AiSettingsState }) {
  const provider = PROVIDERS[ai.settings.provider]
  return (
    <div className="rounded-2xl bg-crema p-4 ring-1 ring-cafe/10">
      <p className="font-bold">🔑 ¿Con qué IA hablamos?</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {(Object.keys(PROVIDERS) as ProviderId[]).map((id) => (
          <button
            key={id}
            onClick={() => ai.setProvider(id)}
            aria-pressed={ai.settings.provider === id}
            className={`rounded-full px-4 py-1 font-bold ${
              ai.settings.provider === id ? 'bg-cafe text-crema' : 'ring-1 ring-cafe/30 hover:ring-cafe'
            }`}
          >
            {PROVIDERS[id].name}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <input
          type="password"
          value={ai.settings.apiKey}
          onChange={(e) => ai.setApiKey(e.target.value)}
          placeholder={`Pegá tu API key (${provider.keyHint})`}
          autoComplete="off"
          className="min-w-64 flex-1 rounded-xl border border-cafe/20 bg-white px-3 py-2 font-mono text-sm"
        />
        {ai.settings.apiKey && (
          <button onClick={ai.forgetKey} className="text-sm underline opacity-75">
            Olvidar llave
          </button>
        )}
      </div>
      <p className="mt-2 text-xs opacity-70">
        Sacá una en{' '}
        <a className="underline" href={provider.keyUrl} target="_blank" rel="noreferrer">
          {provider.keyUrl.replace('https://', '')}
        </a>
        . Se guarda solo en este navegador y viaja directo a {provider.name.split(' ')[0]}; nunca a nuestro código ni al
        repo.
      </p>
    </div>
  )
}
