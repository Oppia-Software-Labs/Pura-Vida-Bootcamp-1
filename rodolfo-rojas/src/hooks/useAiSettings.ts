import { useState } from 'react'
import type { AiSettings, ProviderId } from '../lib/ai'

const STORAGE_KEY = 'abuelita-stellar:ai'
const DEFAULT_SETTINGS: AiSettings = { provider: 'groq', apiKey: '' }

export function useAiSettings() {
  const [settings, setSettings] = useState<AiSettings>(loadSettings)

  const update = (next: AiSettings) => {
    setSettings(next)
    saveSettings(next)
  }

  return {
    settings,
    setProvider: (provider: ProviderId) => update({ ...settings, provider }),
    setApiKey: (apiKey: string) => update({ ...settings, apiKey }),
    forgetKey: () => update({ ...settings, apiKey: '' }),
  }
}

export type AiSettingsState = ReturnType<typeof useAiSettings>

function loadSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<AiSettings>) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

function saveSettings(settings: AiSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    return
  }
}
