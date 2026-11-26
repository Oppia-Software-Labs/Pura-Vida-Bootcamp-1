import { useEffect, useState } from 'react'

const DRAFT_KEY = 'stellar-tip-jar-draft'

export const CREATOR_NAME_MAX_LENGTH = 40
export const MESSAGE_MAX_LENGTH = 160

export type TipJarDraft = {
  creatorName: string
  message: string
}

const EMPTY_DRAFT: TipJarDraft = {
  creatorName: '',
  message: '',
}

function readDraft(): TipJarDraft {
  try {
    const savedDraft = localStorage.getItem(DRAFT_KEY)

    if (!savedDraft) {
      return EMPTY_DRAFT
    }

    const draft: Partial<TipJarDraft> | null = JSON.parse(savedDraft)

    if (
      typeof draft?.creatorName === 'string' &&
      typeof draft.message === 'string'
    ) {
      return {
        creatorName: draft.creatorName.slice(0, CREATOR_NAME_MAX_LENGTH),
        message: draft.message.slice(0, MESSAGE_MAX_LENGTH),
      }
    }
  } catch {
    // El editor puede abrir aunque el borrador guardado no se pueda leer.
  }

  return EMPTY_DRAFT
}

export function useTipJarDraft() {
  const [draft, setDraft] = useState(readDraft)

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
    } catch {
      // Si el almacenamiento falla, el borrador sigue disponible en memoria.
    }
  }, [draft])

  return { draft, setDraft }
}