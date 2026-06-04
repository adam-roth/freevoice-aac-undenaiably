import { useEffect, useRef } from 'react';

/**
 * A11Y-03: makes a modal usable for keyboard / switch / screen-reader users.
 * Attach the returned ref to the modal's content element (and give it
 * role="dialog" aria-modal="true" tabIndex={-1}). While open it:
 *  - moves focus into the dialog,
 *  - traps Tab within it,
 *  - closes on Escape,
 *  - restores focus to the element focused before it opened.
 */
export function useModalA11y<T extends HTMLElement = HTMLDivElement>(
  open: boolean,
  onClose: () => void,
) {
  const ref = useRef<T>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const node = ref.current;
    const prevFocus = document.activeElement as HTMLElement | null;

    const focusables = (): HTMLElement[] => {
      if (!node) return [];
      const sel = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
      return Array.from(node.querySelectorAll<HTMLElement>(sel)).filter(
        (el) => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true' && el.offsetParent !== null,
      );
    };

    (focusables()[0] ?? node)?.focus?.();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !node) return;
      const f = focusables();
      if (f.length === 0) { e.preventDefault(); return; }
      const first = f[0];
      const last = f[f.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === node)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      prevFocus?.focus?.();
    };
  }, [open]);

  return ref;
}
