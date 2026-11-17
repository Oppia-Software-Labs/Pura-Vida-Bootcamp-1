/**
 * Clipboard access is not universal: `navigator.clipboard` is missing on insecure
 * origins and the permission can be denied even over HTTPS. Every failure is
 * reported as `false` so callers can show an inline fallback instead of crashing
 * on a rejected promise inside an event handler.
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  if (text === "") return false;

  const clipboard = typeof navigator === "undefined" ? null : navigator.clipboard;

  if (clipboard !== null && typeof clipboard.writeText === "function") {
    try {
      await clipboard.writeText(text);
      return true;
    } catch {
      // Denied permission or an unfocused document: fall through to the legacy path.
    }
  }

  return copyWithTemporaryTextarea(text);
}

/**
 * `document.execCommand("copy")` is deprecated but remains the only fallback for
 * insecure origins, where the async Clipboard API is unavailable by spec.
 */
function copyWithTemporaryTextarea(text: string): boolean {
  if (!document.body) return false;

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  // Positioning off-screen keeps the page from scrolling to the focused element.
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "-9999px";
  textarea.style.opacity = "0";

  // Focus moves into the textarea, so the user's previous selection is restored after.
  const selection = document.getSelection();
  const previousRange =
    selection !== null && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
    if (selection !== null && previousRange !== null) {
      selection.removeAllRanges();
      selection.addRange(previousRange);
    }
  }
}
