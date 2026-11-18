import {
  CREATOR_NAME_MAX_LENGTH,
  MESSAGE_MAX_LENGTH,
  type TipJarDraft,
} from '../hooks/useTipJarDraft'
import { WalletSection } from './WalletSection'

type TipJarEditorProps = {
  draft: TipJarDraft
  onDraftChange: (draft: TipJarDraft) => void
  address: string | null
  onWalletConnected: (address: string) => void
}

export function TipJarEditor({
  draft,
  onDraftChange,
  address,
  onWalletConnected,
}: TipJarEditorProps) {
  return (
    <section className="panel" aria-labelledby="editor-title">
      <h2 id="editor-title">Personalizá tu buzón</h2>

      <div className="field">
        <label htmlFor="creator-name">Nombre del creador</label>
        <input
          id="creator-name"
          type="text"
          placeholder="Ej. Cristina"
          value={draft.creatorName}
          maxLength={CREATOR_NAME_MAX_LENGTH}
          onChange={(event) =>
            onDraftChange({ ...draft, creatorName: event.target.value })
          }
        />
      </div>

      <div className="field">
        <label htmlFor="tip-message">Mensaje</label>
        <textarea
          id="tip-message"
          rows={4}
          placeholder="Ej. Gracias por apoyar lo que hago."
          value={draft.message}
          maxLength={MESSAGE_MAX_LENGTH}
          onChange={(event) =>
            onDraftChange({ ...draft, message: event.target.value })
          }
        />
      </div>

      <WalletSection address={address} onConnected={onWalletConnected} />
    </section>
  )
}