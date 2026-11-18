import type { ReactNode } from "react";

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
};

export default function Field({ id, label, hint, error, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-message`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-message`} className="text-xs text-faint">
            {hint}
          </p>
        )
      )}
    </div>
  );
}
