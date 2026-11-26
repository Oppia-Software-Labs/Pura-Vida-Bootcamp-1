const cardTones = {
  default: "border-line bg-surface/80",
  accent: "border-accent/25 bg-linear-to-br from-accent/15 via-surface/80 to-surface/80",
};

const cardPadding = {
  normal: "p-5 sm:p-6",
  roomy: "px-5 py-8 sm:px-6 sm:py-10",
};

export function cardClass({ tone = "default", padding = "normal" }: { tone?: keyof typeof cardTones; padding?: keyof typeof cardPadding } = {}) {
  return `animate-rise rounded-2xl border shadow-[inset_0_1px_0_0_rgb(255_255_255/0.04),0_24px_48px_-28px_rgb(0_0_0/0.8)] backdrop-blur motion-reduce:animate-none ${cardTones[tone]} ${cardPadding[padding]}`;
}

export const buttonVariants = {
  primary:
    "bg-accent text-on-accent shadow-[0_8px_24px_-8px_color-mix(in_oklab,var(--color-accent)_70%,transparent)] enabled:hover:-translate-y-px enabled:hover:bg-accent-strong disabled:shadow-none",
  ghost: "border border-line-strong text-fg enabled:hover:bg-raised",
};

export const buttonSizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
};

export function buttonClass({
  variant = "primary",
  size = "md",
}: { variant?: keyof typeof buttonVariants; size?: keyof typeof buttonSizes } = {}) {
  return `inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${buttonSizes[size]} ${buttonVariants[variant]}`;
}
