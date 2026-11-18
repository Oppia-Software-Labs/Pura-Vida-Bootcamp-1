import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StateMessageTone = "muted" | "error" | "success";

const TONE_TITLE: Record<StateMessageTone, string> = {
  muted: "text-muted-foreground",
  error: "text-destructive",
  success: "text-foreground",
};

export interface StateMessageProps {
  title: string;
  description?: string;
  tone?: StateMessageTone;
  children?: ReactNode;
}

/**
 * One block for every non-row state: loading, empty, unfunded and error.
 * Errors are announced; everything else is a quiet status update.
 */
export function StateMessage({
  title,
  description,
  tone = "muted",
  children,
}: StateMessageProps) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className="rounded-lg bg-muted p-4 text-sm"
    >
      <p className={cn("font-medium", TONE_TITLE[tone])}>{title}</p>
      {description === undefined ? null : (
        <p className="mt-1 text-muted-foreground">{description}</p>
      )}
      {children === undefined ? null : <div className="mt-3">{children}</div>}
    </div>
  );
}
