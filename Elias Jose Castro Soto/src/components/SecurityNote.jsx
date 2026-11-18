import { ShieldAlert } from "lucide-react";

export default function SecurityNote({ children, className = "" }) {
  return (
    <p className={`flex items-start gap-2 text-xs text-muted-foreground ${className}`}>
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
