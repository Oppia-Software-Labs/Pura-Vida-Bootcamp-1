import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-azul text-white shadow-hard hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  secondary: 'bg-white text-navy shadow-hard hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none',
  ghost: 'border border-azul bg-white text-azul hover:bg-niebla',
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`eyebrow inline-flex min-h-11 items-center justify-center gap-2 px-5 py-3 font-semibold transition-transform duration-100 disabled:pointer-events-none disabled:opacity-50 ${BUTTON_STYLES[variant]} ${className}`}
    />
  )
}

export function Eyebrow({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow text-azul ${className}`}>{children}</p>
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`border-2 border-navy bg-white shadow-hard ${className}`}>{children}</div>
}

export function Notice({ tone, children }: { tone: 'error' | 'info' | 'success'; children: ReactNode }) {
  const styles = {
    error: 'border-rojo text-rojo',
    info: 'border-azul text-navy',
    success: 'border-verde text-verde',
  }
  return <p className={`border-l-4 bg-white px-4 py-3 text-sm ${styles[tone]}`}>{children}</p>
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-azul underline underline-offset-4 hover:text-navy">
      {children}
    </a>
  )
}
