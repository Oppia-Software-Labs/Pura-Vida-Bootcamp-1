import { useState } from "react";
import { Button } from "./primitives";

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
    <Button variant="ghost" size="sm" onClick={copy} aria-label={label}>
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}
