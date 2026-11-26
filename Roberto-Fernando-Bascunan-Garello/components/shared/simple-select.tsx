"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

export interface OpcionSelect {
  value: string
  label: React.ReactNode
  disabled?: boolean
}

interface Props {
  value: string
  onChange: (value: string) => void
  opciones: OpcionSelect[]
  placeholder?: string
  className?: string
  id?: string
  ariaLabel?: string
  disabled?: boolean
}

export function SimpleSelect({ value, onChange, opciones, placeholder = "Seleccionar", className, id, ariaLabel, disabled }: Props) {
  const seleccionada = opciones.find((o) => o.value === value)
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (typeof v === "string") onChange(v)
      }}
      disabled={disabled}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={cn("h-9 w-full min-w-0 rounded-xl bg-card", className)}>
        <SelectValue>{() => (seleccionada ? seleccionada.label : <span className="text-muted-foreground">{placeholder}</span>)}</SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} className="max-h-72">
        {opciones.map((o) => (
          <SelectItem key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
