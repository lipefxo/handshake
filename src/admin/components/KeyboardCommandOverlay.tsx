import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';

type ShortcutFeedback = {
  keys: string[];
  label: string;
};

const DISMISS_MS = 1200;

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName.toLowerCase();
  if (tagName === 'textarea') return true;
  if (tagName !== 'input') return false;

  const inputType = (target as HTMLInputElement).type;
  return inputType !== 'button' && inputType !== 'checkbox' && inputType !== 'radio';
}

function normalizeKey(key: string): string {
  if (key === ' ') return 'space';
  return key.toLowerCase();
}

function getBaseKeyLabel(key: string): string {
  switch (key) {
    case 'arrowup':
      return '↑';
    case 'arrowdown':
      return '↓';
    case 'arrowleft':
      return '←';
    case 'arrowright':
      return '→';
    case 'escape':
      return 'Esc';
    case 'backspace':
      return '⌫';
    case 'delete':
      return '⌦';
    case 'pageup':
      return 'PgUp';
    case 'pagedown':
      return 'PgDn';
    case 'space':
      return 'Space';
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

function resolveShortcutFeedback(
  event: KeyboardEvent,
  isMac: boolean,
  editableTarget: boolean,
): ShortcutFeedback | null {
  const key = normalizeKey(event.key);
  const usesPrimaryModifier = event.metaKey || event.ctrlKey;
  const primaryKey = isMac ? '⌘' : 'Ctrl';

  if (usesPrimaryModifier) {
    const keys: string[] = [primaryKey];
    if (event.shiftKey) keys.push('⇧');
    if (event.altKey) keys.push(isMac ? '⌥' : 'Alt');
    keys.push(getBaseKeyLabel(key));

    if (key === 'z' && event.shiftKey) return { keys, label: 'Redo' };
    if (key === 'z') return { keys, label: 'Undo' };
    if (key === 'c') return { keys, label: 'Copy' };
    if (key === 'v') return { keys, label: 'Paste' };
    if (key === 'x') return { keys, label: 'Cut' };
    if (key === 'a') return { keys, label: 'Select All' };
    if (key === 's') return { keys, label: 'Save' };
    return null;
  }

  // Avoid noisy overlays while users type/edit text.
  if (editableTarget && key !== 'escape') return null;

  if (key === 'arrowup') return { keys: ['↑'], label: 'Move Up' };
  if (key === 'arrowdown') return { keys: ['↓'], label: 'Move Down' };
  if (key === 'arrowleft') return { keys: ['←'], label: 'Move Left' };
  if (key === 'arrowright') return { keys: ['→'], label: 'Move Right' };
  if (key === 'pageup') return { keys: ['PgUp'], label: 'Page Up' };
  if (key === 'pagedown') return { keys: ['PgDn'], label: 'Page Down' };
  if (key === 'escape') return { keys: ['Esc'], label: 'Escape' };
  if (key === 'backspace' || key === 'delete') return { keys: [getBaseKeyLabel(key)], label: 'Delete' };
  if (key === 'space') return { keys: ['Space'], label: 'Next' };

  return null;
}

export function KeyboardCommandOverlay() {
  const [feedback, setFeedback] = useState<ShortcutFeedback | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const isMac = useMemo(
    () => /mac|iphone|ipad|ipod/i.test(globalThis.navigator?.platform ?? ''),
    [],
  );

  useEffect(() => {
    const clearFeedbackTimer = () => {
      if (timeoutRef.current === null) return;
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    };

    const showFeedback = (next: ShortcutFeedback) => {
      setFeedback(next);
      clearFeedbackTimer();
      timeoutRef.current = window.setTimeout(() => {
        setFeedback(null);
        timeoutRef.current = null;
      }, DISMISS_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const editableTarget = isEditableTarget(event.target);
      const next = resolveShortcutFeedback(event, isMac, editableTarget);
      if (!next) return;
      showFeedback(next);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearFeedbackTimer();
    };
  }, [isMac]);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={`${feedback.label}-${feedback.keys.join('+')}`}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex items-center gap-3 rounded-full border border-white/20 bg-black/75 px-3.5 py-2 text-xs text-white shadow-lg backdrop-blur-md"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-1">
              {feedback.keys.map((keyPart) => (
                <kbd
                  key={keyPart}
                  className="min-w-5 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-center text-[11px] font-medium text-white/95"
                >
                  {keyPart}
                </kbd>
              ))}
            </div>
            <span className="h-3.5 w-px bg-white/20" />
            <span className="text-[11px] font-medium tracking-wide text-white/95">{feedback.label}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
