import { useState } from "react";

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} aria-label={label} className="btn btn-ghost px-3 py-1.5 text-xs">
      {copied ? "Copiado" : "Copiar"}
    </button>
  );
}
