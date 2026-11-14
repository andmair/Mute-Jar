export const DEFAULT_AUDIO_MONITOR_HOTKEY = 'Alt+Shift+M';

const MODIFIER_KEYS = new Set([
  'Control',
  'Ctrl',
  'Alt',
  'Option',
  'Shift',
  'Meta',
  'OS',
  'Super',
]);

export interface HotkeyParseResult {
  hotkey: string | null;
  cancelled?: boolean;
  error?: string;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== 'string') return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  return false;
}

export function normalizePrimaryKey(key: string, code?: string): string | null {
  if (!key || MODIFIER_KEYS.has(key)) return null;

  // Prefer physical letter/digit code so macOS Alt/Option combos (e.g. Alt+Shift+M -> Â/µ) match reliably
  if (code) {
    const keyMatch = /^Key([A-Z])$/.exec(code);
    if (keyMatch) return keyMatch[1];

    const digitMatch = /^Digit([0-9])$/.exec(code);
    if (digitMatch) return digitMatch[1];
  }

  if (key === ' ') return 'Space';
  if (/^F([1-9]|1[0-2])$/i.test(key)) return key.toUpperCase();
  if (key.length === 1) return key.toUpperCase();

  switch (key) {
    case 'ArrowUp':
    case 'ArrowDown':
    case 'ArrowLeft':
    case 'ArrowRight':
    case 'Enter':
    case 'Tab':
    case 'Backspace':
    case 'Delete':
    case 'Home':
    case 'End':
    case 'PageUp':
    case 'PageDown':
      return key;
    default:
      return null;
  }
}

export function parseHotkeyFromEvent(e: {
  key: string;
  code?: string;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
}): HotkeyParseResult {
  if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && !e.metaKey) {
    return { hotkey: null, cancelled: true };
  }

  if (MODIFIER_KEYS.has(e.key)) {
    return { hotkey: null };
  }

  const primary = normalizePrimaryKey(e.key, e.code);
  if (!primary) {
    return { hotkey: null, error: 'Unsupported key. Try a letter, number, or function key.' };
  }

  const parts: string[] = [];
  if (e.ctrlKey) parts.push('Ctrl');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');
  if (e.metaKey) parts.push('Meta');

  const isFunctionKey = /^F([1-9]|1[0-2])$/.test(primary);
  if (parts.length === 0 && !isFunctionKey) {
    return {
      hotkey: null,
      error: 'Include at least one modifier key (Ctrl, Alt, Shift, or Cmd/Meta), or use F1–F12.',
    };
  }

  parts.push(primary);
  return { hotkey: parts.join('+') };
}

export function matchesHotkey(
  e: {
    key: string;
    code?: string;
    ctrlKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    metaKey: boolean;
    repeat?: boolean;
  },
  configuredHotkey?: string
): boolean {
  if (!configuredHotkey || !configuredHotkey.trim() || e.repeat) return false;

  const tokens = configuredHotkey
    .split('+')
    .map((t) => t.trim())
    .filter(Boolean);

  if (tokens.length === 0) return false;

  const expectedCtrl = tokens.some((t) => t.toLowerCase() === 'ctrl' || t.toLowerCase() === 'control');
  const expectedAlt = tokens.some((t) => t.toLowerCase() === 'alt' || t.toLowerCase() === 'option');
  const expectedShift = tokens.some((t) => t.toLowerCase() === 'shift');
  const expectedMeta = tokens.some(
    (t) => t.toLowerCase() === 'meta' || t.toLowerCase() === 'cmd' || t.toLowerCase() === 'command'
  );

  if (
    Boolean(e.ctrlKey) !== expectedCtrl ||
    Boolean(e.altKey) !== expectedAlt ||
    Boolean(e.shiftKey) !== expectedShift ||
    Boolean(e.metaKey) !== expectedMeta
  ) {
    return false;
  }

  const nonModTokens = tokens.filter(
    (t) => !['ctrl', 'control', 'alt', 'option', 'shift', 'meta', 'cmd', 'command'].includes(t.toLowerCase())
  );
  if (nonModTokens.length !== 1) return false;

  const expectedKey = nonModTokens[0].toLowerCase();
  const actualPrimary = normalizePrimaryKey(e.key, e.code);
  if (!actualPrimary) return false;

  return actualPrimary.toLowerCase() === expectedKey;
}
