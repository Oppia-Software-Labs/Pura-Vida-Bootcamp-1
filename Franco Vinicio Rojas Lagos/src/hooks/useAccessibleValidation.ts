import { useEffect, type RefObject } from "react";

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFormControl(target: EventTarget | null): target is FormControl {
  return (
    target instanceof HTMLElement &&
    target.matches("input, select, textarea")
  );
}

function linkError(el: FormControl, shown: boolean) {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute("aria-describedby") || "")
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute("aria-describedby", ids.join(" "));
  else el.removeAttribute("aria-describedby");
}

function spokenText(node: HTMLElement): string {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((n) => n.remove());
  copy.querySelectorAll('[role="img"][aria-label]').forEach((n) => {
    n.replaceWith(`${n.getAttribute("aria-label")}: `);
  });
  return (copy.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * Synchronizes programmatic ARIA validation states (`aria-invalid` and dynamic
 * `aria-describedby` from `data-error`) with CSS `:user-invalid`, and announces
 * post-interaction errors via a single polite live region.
 */
export function useAccessibleValidation(formRef: RefObject<HTMLFormElement | null>) {
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const supportsUserInvalid =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("selector(:user-invalid)");

    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "polite");
    announcer.classList.add("visually-hidden");
    document.body.append(announcer);

    let announceTimer: number | undefined;
    let announcedField: FormControl | null = null;
    const flagged = new WeakSet<FormControl>();
    const announced = new WeakSet<FormControl>();
    const dirtyState = new WeakMap<
      FormControl,
      { hasInteracted: boolean; hasBlurred: boolean }
    >();

    const announceError = (el: FormControl) => {
      const errorId = el.dataset.error;
      if (!errorId) return;
      const errorEl = document.getElementById(errorId);
      if (!errorEl) return;
      const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : "";
      window.clearTimeout(announceTimer);
      announcer.textContent = "";
      announcedField = el;
      announceTimer = window.setTimeout(() => {
        announcer.textContent = label + spokenText(errorEl);
      }, 500);
    };

    const syncAria = (el: FormControl, announce = false, forceCheck = false) => {
      const invalid = forceCheck
        ? !el.validity.valid
        : supportsUserInvalid
          ? el.matches(":user-invalid") || el.classList.contains("user-invalid-fallback")
          : !el.validity.valid;

      if (!supportsUserInvalid || forceCheck || el.classList.contains("user-invalid-fallback")) {
        const actuallyInvalid = !el.validity.valid;
        el.classList.toggle("user-invalid-fallback", actuallyInvalid);
        el.classList.toggle("user-valid-fallback", !actuallyInvalid);
      }

      if (invalid && !el.validity.valid) {
        if (announce && !announced.has(el)) {
          announceError(el);
          announced.add(el);
        }
        el.setAttribute("aria-invalid", "true");
        linkError(el, true);
        flagged.add(el);
      } else if (flagged.has(el) || el.getAttribute("aria-invalid") !== "true") {
        el.classList.remove("user-invalid-fallback");
        el.setAttribute("aria-invalid", "false");
        linkError(el, false);
        flagged.delete(el);
        announced.delete(el);
        if (announcedField === el) {
          window.clearTimeout(announceTimer);
          announcer.textContent = "";
        }
      }
    };

    // Start every field at aria-invalid="false" to avoid premature invalid announcements.
    form.querySelectorAll<FormControl>("input, select, textarea").forEach((el) => {
      el.setAttribute("aria-invalid", "false");
      linkError(el, false);
    });

    const onBlur = (e: Event) => {
      if (!isFormControl(e.target)) return;
      if (!supportsUserInvalid) {
        const state = dirtyState.get(e.target) ?? {
          hasInteracted: false,
          hasBlurred: false,
        };
        state.hasBlurred = true;
        dirtyState.set(e.target, state);
        if (!state.hasInteracted) return;
      }
      syncAria(e.target, true);
    };

    const onInput = (e: Event) => {
      if (!isFormControl(e.target)) return;
      if (!supportsUserInvalid) {
        const state = dirtyState.get(e.target) ?? {
          hasInteracted: false,
          hasBlurred: false,
        };
        state.hasInteracted = true;
        dirtyState.set(e.target, state);
        if (!state.hasBlurred) return;
      }
      if (e.target.hasAttribute("aria-invalid")) syncAria(e.target);
    };

    const onChange = (e: Event) => {
      if (!isFormControl(e.target)) return;
      if (!supportsUserInvalid) {
        const state = dirtyState.get(e.target) ?? {
          hasInteracted: false,
          hasBlurred: false,
        };
        state.hasInteracted = true;
        dirtyState.set(e.target, state);
        if (!state.hasBlurred) return;
      }
      syncAria(e.target, true);
    };

    const onInvalid = (e: Event) => {
      if (!isFormControl(e.target)) return;
      dirtyState.set(e.target, { hasInteracted: true, hasBlurred: true });
      announced.add(e.target);
      syncAria(e.target, false, true);
    };

    const onReset = () => {
      window.setTimeout(() => {
        form
          .querySelectorAll<FormControl>("input, select, textarea")
          .forEach((el) => {
            dirtyState.delete(el);
            el.classList.remove("user-invalid-fallback", "user-valid-fallback");
            el.setAttribute("aria-invalid", "false");
            linkError(el, false);
            flagged.delete(el);
            announced.delete(el);
          });
      });
    };

    form.addEventListener("blur", onBlur, true);
    form.addEventListener("input", onInput);
    form.addEventListener("change", onChange, true);
    form.addEventListener("invalid", onInvalid, true);
    form.addEventListener("reset", onReset, true);

    return () => {
      window.clearTimeout(announceTimer);
      announcer.remove();
      form.removeEventListener("blur", onBlur, true);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onChange, true);
      form.removeEventListener("invalid", onInvalid, true);
      form.removeEventListener("reset", onReset, true);
    };
  }, [formRef]);
}
