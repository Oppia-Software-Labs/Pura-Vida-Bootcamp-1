import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full bg-primary-soft px-2.5 text-xs font-semibold text-primary-ink",
        className,
      )}
      {...props}
    />
  );
}
