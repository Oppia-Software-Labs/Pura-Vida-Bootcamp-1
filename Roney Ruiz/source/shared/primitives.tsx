import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { buttonClass, buttonSizes, buttonVariants } from "@helpers/classes";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof buttonSizes;
};

export function Button({ variant, size, className = "", type = "button", ...props }: ButtonProps) {
  return <button type={type} className={`${buttonClass({ variant, size })} ${className}`} {...props} />;
}

export function Chip({
  pressed,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pressed: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={`cursor-pointer rounded-full border border-line-strong px-3 py-1 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-fg aria-pressed:border-accent aria-pressed:bg-accent/15 aria-pressed:text-accent-strong ${className}`}
      {...props}
    />
  );
}

export function Input({
  compact = false,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { compact?: boolean }) {
  return (
    <input
      className={`w-full rounded-lg border border-line-strong bg-canvas/70 px-3 py-2.5 text-fg transition-colors placeholder:text-faint hover:border-faint focus:border-accent focus-visible:outline-0 focus-visible:ring-2 focus-visible:ring-accent/40 aria-invalid:border-danger ${compact ? "text-xs sm:text-sm" : "text-sm"} ${className}`}
      {...props}
    />
  );
}

export function Alert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
      {children}
    </p>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
    />
  );
}
