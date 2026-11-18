import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

/** Superficie plana con borde fino. Sin sombras ni brillos. */
export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-6 sm:p-8 ${className}`}>{children}</section>;
}

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export function Button({ variant = "primary", className = "", ...rest }: BtnProps) {
  const look =
    variant === "primary"
      ? "bg-ink text-void hover:bg-white"
      : "border border-line text-ink hover:border-muted";
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium transition-colors duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-40 ${look} ${className}`}
    />
  );
}

/** Enlace de texto, para acciones secundarias. */
export function TextButton({ className = "", ...rest }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`text-sm text-accent underline decoration-accent/40 underline-offset-4 transition-colors hover:decoration-accent ${className}`}
    />
  );
}

export function Field({
  label,
  hint,
  error,
  ...rest
}: { label: string; hint?: string; error?: string | null } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm text-muted">{label}</span>
      <input {...rest} aria-invalid={!!error} className="field" />
      {error ? (
        <span className="mt-2 block text-sm text-danger">{error}</span>
      ) : hint ? (
        <span className="mt-2 block text-xs text-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Notice({ tone = "warn", children }: { tone?: "warn" | "danger"; children: ReactNode }) {
  const c = tone === "danger" ? "border-danger text-danger" : "border-warn text-warn";
  return (
    <div role="alert" className={`border-l-2 py-1 pl-4 text-sm leading-relaxed ${c}`}>
      {children}
    </div>
  );
}

/** Estado de un cobro: un punto de color y la palabra. */
export function Status({ paid }: { paid: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm ${paid ? "text-ok" : "text-muted"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${paid ? "bg-ok" : "bg-muted"}`} />
      {paid ? "Pagado" : "Pendiente"}
    </span>
  );
}

/** Lista de datos etiqueta → valor. */
export function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="divide-y divide-line border-y border-line text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex items-baseline justify-between gap-6 py-3">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0 truncate text-right">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
