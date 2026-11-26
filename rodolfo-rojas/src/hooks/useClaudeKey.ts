import { useState } from 'react'

const STORAGE_KEY = 'abuelita-stellar:claude-key'

export function useClaudeKey() {
  const [apiKey, setKey] = useState(loadKey)

  const setApiKey = (value: string) => {
    setKey(value)
    saveKey(value)
  }

  return { apiKey, setApiKey, forget: () => setApiKey('') }
}

export type ClaudeKey = ReturnType<typeof useClaudeKey>

function loadKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? ''
  } catch {
    return ''
  }
}

function saveKey(value: string) {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    return
  }
}
