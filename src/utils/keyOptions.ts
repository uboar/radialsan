export const MODIFIER_NAMES = ["Ctrl", "Shift", "Alt", "Meta"] as const;

export type ModifierName = (typeof MODIFIER_NAMES)[number];

const LETTER_KEYS = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
] as const;

const NUMBER_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

const FUNCTION_KEYS = [
  "F1",
  "F2",
  "F3",
  "F4",
  "F5",
  "F6",
  "F7",
  "F8",
  "F9",
  "F10",
  "F11",
  "F12",
] as const;

const NAVIGATION_KEYS = [
  "Up",
  "Down",
  "Left",
  "Right",
  "Home",
  "End",
  "PageUp",
  "PageDown",
] as const;

export const SEND_KEY_OPTIONS = [
  ...LETTER_KEYS,
  ...NUMBER_KEYS,
  ...FUNCTION_KEYS,
  "Space",
  "Tab",
  "CapsLock",
  "Escape",
  "Return",
  "Backspace",
  "Delete",
  ...NAVIGATION_KEYS,
] as const;

export const HOTKEY_OPTIONS = [
  ...LETTER_KEYS,
  ...NUMBER_KEYS,
  ...FUNCTION_KEYS,
  "Space",
  "Tab",
  "CapsLock",
  "Escape",
  "Return",
  "Backspace",
  "Delete",
  "Up",
  "Down",
  "Left",
  "Right",
  "Mouse4",
  "Mouse5",
] as const;

function canonicalizeKeyName(value: string): string {
  const trimmed = value.trim();
  const lower = trimmed.toLowerCase();

  if (/^[a-z]$/.test(lower)) return lower.toUpperCase();
  if (/^f([1-9]|1[0-2])$/.test(lower)) return lower.toUpperCase();

  const aliases: Record<string, string> = {
    space: "Space",
    tab: "Tab",
    capslock: "CapsLock",
    caps_lock: "CapsLock",
    escape: "Escape",
    esc: "Escape",
    return: "Return",
    enter: "Return",
    backspace: "Backspace",
    delete: "Delete",
    del: "Delete",
    up: "Up",
    down: "Down",
    left: "Left",
    right: "Right",
    home: "Home",
    end: "End",
    pageup: "PageUp",
    pgup: "PageUp",
    pagedown: "PageDown",
    pgdown: "PageDown",
    pgdn: "PageDown",
    mouse4: "Mouse4",
    mouse5: "Mouse5",
  };

  return aliases[lower] ?? trimmed;
}

export function parseKeyCombo(value: string): {
  modifiers: ModifierName[];
  key: string;
} {
  const parts = value.split("+").map((part) => part.trim());
  const key = canonicalizeKeyName(parts[parts.length - 1] ?? "");
  const modifiers = MODIFIER_NAMES.filter((modifier) =>
    parts
      .slice(0, -1)
      .filter(Boolean)
      .some((part) => part.toLowerCase() === modifier.toLowerCase()),
  );
  return { modifiers, key };
}

export function buildKeyCombo(
  modifiers: readonly string[],
  key: string,
): string {
  const sortedModifiers = MODIFIER_NAMES.filter((modifier) =>
    modifiers.includes(modifier),
  );
  const normalizedKey = canonicalizeKeyName(key);
  if (!normalizedKey) {
    return sortedModifiers.length > 0 ? `${sortedModifiers.join("+")}+` : "";
  }
  return [...sortedModifiers, normalizedKey].join("+");
}

export function toggleModifier(
  modifiers: readonly ModifierName[],
  modifier: ModifierName,
): ModifierName[] {
  if (modifiers.includes(modifier)) {
    return modifiers.filter((existing) => existing !== modifier);
  }
  return MODIFIER_NAMES.filter(
    (existing) => existing === modifier || modifiers.includes(existing),
  );
}
