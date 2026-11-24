import { useEffect, useId, useRef, useState } from 'react'
import { useLanguage } from '../i18n/useLanguage'
import {
  loadGoals,
  parseAmount,
  progressPercent,
  saveGoals,
  sumAmounts,
  visualPercent,
} from '../goals/storage'

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `goal-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function formatAmount(lang, value) {
  const formatted = new Intl.NumberFormat(lang === 'es' ? 'es-CR' : 'en-US', {
    maximumFractionDigits: 7,
  }).format(Number(value))
  return `${formatted} XLM`
}

function amountToInput(lang, value) {
  return lang === 'es' ? value.replace('.', ',') : value
}

function todayInput() {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

function parseDate(raw) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null
  const [year, month, day] = raw.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null
  }
  return raw
}

function formatDate(lang, iso) {
  const [year, month, day] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat(lang === 'es' ? 'es-CR' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function GoalsSection() {
  const { lang, t } = useLanguage()
  const [goals, setGoals] = useState(loadGoals)
  const [formMode, setFormMode] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [recordingId, setRecordingId] = useState(null)
  const [draft, setDraft] = useState({ name: '', target: '' })
  const [recordDraft, setRecordDraft] = useState({ amount: '', date: todayInput() })
  const [errors, setErrors] = useState({})
  const [recordErrors, setRecordErrors] = useState({})
  const skipPersist = useRef(true)
  const recordLock = useRef(false)
  const formRef = useRef(null)
  const deleteRef = useRef(null)
  const recordRef = useRef(null)
  const nameId = useId()
  const targetId = useId()
  const nameErrorId = useId()
  const targetErrorId = useId()
  const targetHintId = useId()
  const amountId = useId()
  const dateId = useId()
  const amountErrorId = useId()
  const dateErrorId = useId()
  const recordHintId = useId()

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false
      return
    }
    saveGoals(goals)
  }, [goals])

  function openDialog(ref, focusSelector) {
    const node = ref.current
    if (node && !node.open) node.showModal()
    node?.querySelector(focusSelector)?.focus()
  }

  function openCreate() {
    setEditingId(null)
    setDraft({ name: '', target: '' })
    setErrors({})
    setFormMode('create')
    openDialog(formRef, 'input[name="name"]')
  }

  function openEdit(goal) {
    setEditingId(goal.id)
    setDraft({ name: goal.name, target: amountToInput(lang, goal.target) })
    setErrors({})
    setFormMode('edit')
    openDialog(formRef, 'input[name="name"]')
  }

  function closeForm() {
    setFormMode(null)
    if (formRef.current?.open) formRef.current.close()
  }

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  function saveGoal(event) {
    event.preventDefault()
    const name = draft.name.trim()
    const target = parseAmount(draft.target)
    const nextErrors = {}
    if (!name) nextErrors.name = true
    if (!target) nextErrors.target = true
    if (nextErrors.name || nextErrors.target) {
      setErrors(nextErrors)
      return
    }

    if (formMode === 'edit') {
      setGoals((current) =>
        current.map((goal) => (goal.id === editingId ? { ...goal, name, target } : goal)),
      )
    } else {
      setGoals((current) => [...current, { id: createId(), name, target, contributions: [] }])
    }
    closeForm()
  }

  function askDelete(goal) {
    setPendingDelete(goal)
    openDialog(deleteRef, 'button')
  }

  function closeDelete() {
    setPendingDelete(null)
    if (deleteRef.current?.open) deleteRef.current.close()
  }

  function confirmDelete() {
    if (!pendingDelete) return
    setGoals((current) => current.filter((goal) => goal.id !== pendingDelete.id))
    closeDelete()
  }

  function openRecord(goal) {
    setRecordingId(goal.id)
    setRecordDraft({ amount: '', date: todayInput() })
    setRecordErrors({})
    openDialog(recordRef, 'input[name="amount"]')
  }

  function closeRecord() {
    setRecordingId(null)
    recordLock.current = false
    if (recordRef.current?.open) recordRef.current.close()
  }

  function updateRecord(field, value) {
    setRecordDraft((current) => ({ ...current, [field]: value }))
    setRecordErrors((current) => ({ ...current, [field]: undefined }))
  }

  function saveRecord(event) {
    event.preventDefault()
    if (recordLock.current || !recordingId) return
    const amount = parseAmount(recordDraft.amount)
    const date = parseDate(recordDraft.date)
    const nextErrors = {}
    if (!amount) nextErrors.amount = true
    if (!date) nextErrors.date = true
    if (nextErrors.amount || nextErrors.date) {
      setRecordErrors(nextErrors)
      return
    }

    recordLock.current = true
    const entry = { id: createId(), amount, date }
    setGoals((current) =>
      current.map((goal) => {
        if (goal.id !== recordingId) return goal
        if (goal.contributions.some((item) => item.id === entry.id)) return goal
        return { ...goal, contributions: [...goal.contributions, entry] }
      }),
    )
    closeRecord()
  }

  return (
    <section className="goals" id="goals" aria-labelledby="goals-title">
      <div className="goals__head">
        <h2 id="goals-title">{t.goalsTitle}</h2>
        <button type="button" className="btn btn--line" onClick={openCreate}>
          + {t.createGoal}
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="goals__empty">
          <p className="goals__empty-title">{t.emptyGoals}</p>
          <p className="goals__note">{t.emptyGoalsHint}</p>
        </div>
      ) : (
        <>
          <p className="goals__note">{t.targetDisclaimer}</p>
          <ol className="goal-list">
            {goals.map((goal, index) => {
              const recorded = sumAmounts(goal.contributions.map((item) => item.amount))
              const percent = progressPercent(recorded, goal.target)
              const width = visualPercent(recorded, goal.target)
              const history = [...goal.contributions].reverse()
              return (
                <li key={goal.id} className="goal">
                  <span className="goal__index">/{String(index + 1).padStart(2, '0')}</span>
                  <h3>{goal.name}</h3>
                  <div className="goal__actions">
                    <button type="button" className="btn btn--line" onClick={() => openRecord(goal)}>
                      {t.record}
                    </button>
                    <button type="button" className="btn btn--line" onClick={() => openEdit(goal)}>
                      {t.edit}
                    </button>
                    <button type="button" className="btn btn--line" onClick={() => askDelete(goal)}>
                      {t.remove}
                    </button>
                  </div>
                  <p className="goal__figures">
                    <span>
                      <span className="goal__key">{t.targetLabel}</span>
                      {formatAmount(lang, goal.target)}
                    </span>
                    <span>
                      <span className="goal__key">{t.recordedLabel}</span>
                      {formatAmount(lang, recorded)}
                    </span>
                  </p>
                  <div
                    className="goal__track"
                    role="progressbar"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(width)}
                    aria-valuetext={t.percentValue.replace('{percent}', percent)}
                    aria-label={`${goal.name} ${t.progressLabel}`}
                  >
                    <span className="goal__fill" style={{ width: `${width}%` }} />
                  </div>
                  <p className="goal__percent">{t.percentValue.replace('{percent}', percent)}</p>
                  <div className="goal__history">
                    <p className="goal__history-title">{t.historyTitle}</p>
                    {history.length === 0 ? (
                      <p className="goal__history-empty">{t.noRecords}</p>
                    ) : (
                      <ul>
                        {history.map((item) => (
                          <li key={item.id}>
                            <time dateTime={item.date}>{formatDate(lang, item.date)}</time>
                            <span>{formatAmount(lang, item.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </>
      )}

      <dialog
        ref={formRef}
        className="goal-dialog"
        aria-labelledby="goal-form-title"
        onClose={closeForm}
      >
        <form className="goal-form" onSubmit={saveGoal} noValidate>
          <div className="goal-form__head">
            <h3 id="goal-form-title">
              {formMode === 'edit' ? t.formEditTitle : t.formCreateTitle}
            </h3>
            <button type="button" className="btn btn--line" onClick={closeForm}>
              {t.close}
            </button>
          </div>
          <div className="field">
            <label htmlFor={nameId}>{t.nameLabel}</label>
            <input
              id={nameId}
              name="name"
              type="text"
              autoComplete="off"
              value={draft.name}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? nameErrorId : undefined}
              onChange={(event) => updateDraft('name', event.target.value)}
            />
            {errors.name ? (
              <p id={nameErrorId} className="field__error" role="alert">
                {t.nameError}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor={targetId}>{t.targetLabel}</label>
            <input
              id={targetId}
              name="target"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={draft.target}
              aria-invalid={errors.target ? 'true' : 'false'}
              aria-describedby={errors.target ? `${targetHintId} ${targetErrorId}` : targetHintId}
              onChange={(event) => updateDraft('target', event.target.value)}
            />
            <p id={targetHintId} className="field__hint">
              {t.targetHint}
            </p>
            {errors.target ? (
              <p id={targetErrorId} className="field__error" role="alert">
                {t.targetError}
              </p>
            ) : null}
          </div>
          <div className="dialog__actions">
            <button type="button" className="btn btn--line" onClick={closeForm}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn--solid">
              {t.save}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={recordRef}
        className="goal-dialog"
        aria-labelledby="record-title"
        onClose={closeRecord}
      >
        <form onSubmit={saveRecord} noValidate>
          <div className="goal-form__head">
            <h3 id="record-title">{t.recordTitle}</h3>
            <button type="button" className="btn btn--line" onClick={closeRecord}>
              {t.close}
            </button>
          </div>
          <div className="field">
            <label htmlFor={amountId}>{t.recordedLabel}</label>
            <input
              id={amountId}
              name="amount"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              value={recordDraft.amount}
              aria-invalid={recordErrors.amount ? 'true' : 'false'}
              aria-describedby={recordErrors.amount ? `${recordHintId} ${amountErrorId}` : recordHintId}
              onChange={(event) => updateRecord('amount', event.target.value)}
            />
            <p id={recordHintId} className="field__hint">
              {t.recordHint}
            </p>
            {recordErrors.amount ? (
              <p id={amountErrorId} className="field__error" role="alert">
                {t.targetError}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label htmlFor={dateId}>{t.dateLabel}</label>
            <input
              id={dateId}
              name="date"
              type="date"
              value={recordDraft.date}
              aria-invalid={recordErrors.date ? 'true' : 'false'}
              aria-describedby={recordErrors.date ? dateErrorId : undefined}
              onChange={(event) => updateRecord('date', event.target.value)}
            />
            {recordErrors.date ? (
              <p id={dateErrorId} className="field__error" role="alert">
                {t.dateError}
              </p>
            ) : null}
          </div>
          <div className="dialog__actions">
            <button type="button" className="btn btn--line" onClick={closeRecord}>
              {t.cancel}
            </button>
            <button type="submit" className="btn btn--solid">
              {t.save}
            </button>
          </div>
        </form>
      </dialog>

      <dialog
        ref={deleteRef}
        className="goal-dialog"
        aria-labelledby="delete-title"
        aria-describedby="delete-body"
        onClose={() => setPendingDelete(null)}
      >
        <h3 id="delete-title">{t.deleteTitle}</h3>
        <p id="delete-body" className="goals__note">
          {t.deleteBody.replace('{name}', pendingDelete?.name ?? '')}
        </p>
        <div className="dialog__actions">
          <button type="button" className="btn btn--line" onClick={closeDelete}>
            {t.cancel}
          </button>
          <button type="button" className="btn btn--solid" onClick={confirmDelete}>
            {t.confirmDelete}
          </button>
        </div>
      </dialog>
    </section>
  )
}
