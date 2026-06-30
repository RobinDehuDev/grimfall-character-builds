export const WOTLK_PLAYABLE_CLASSES = [
  { wotlkClass: "death-knight", name: "Death Knight", sortOrder: 1 },
  { wotlkClass: "druid", name: "Druid", sortOrder: 2 },
  { wotlkClass: "hunter", name: "Hunter", sortOrder: 3 },
  { wotlkClass: "mage", name: "Mage", sortOrder: 4 },
  { wotlkClass: "paladin", name: "Paladin", sortOrder: 5 },
  { wotlkClass: "priest", name: "Priest", sortOrder: 6 },
  { wotlkClass: "rogue", name: "Rogue", sortOrder: 7 },
  { wotlkClass: "shaman", name: "Shaman", sortOrder: 8 },
  { wotlkClass: "warlock", name: "Warlock", sortOrder: 9 },
  { wotlkClass: "warrior", name: "Warrior", sortOrder: 10 },
] as const;

/** Admin-only buckets — hidden from public ability pickers and lists. */
export const HIDDEN_WOTLK_CLASSES = [
  { wotlkClass: "general", name: "General", sortOrder: 101 },
  { wotlkClass: "racials", name: "Racial", sortOrder: 102 },
  { wotlkClass: "profession", name: "Profession", sortOrder: 103 },
  { wotlkClass: "dnd", name: "DND", sortOrder: 104 },
  { wotlkClass: "unknown", name: "Unknown", sortOrder: 105 },
] as const;

export const WOTLK_CLASSES = [...WOTLK_PLAYABLE_CLASSES, ...HIDDEN_WOTLK_CLASSES] as const;

export type PlayableWotlkClassSlug =
  (typeof WOTLK_PLAYABLE_CLASSES)[number]["wotlkClass"];

export type HiddenWotlkClassSlug =
  (typeof HIDDEN_WOTLK_CLASSES)[number]["wotlkClass"];

export type WotlkClassSlug = PlayableWotlkClassSlug | HiddenWotlkClassSlug;

export const HIDDEN_WOTLK_CLASS_SLUGS = new Set<string>(
  HIDDEN_WOTLK_CLASSES.map((c) => c.wotlkClass),
);

export const WOTLK_CLASS_NAME_BY_SLUG = new Map(
  WOTLK_CLASSES.map((c) => [c.wotlkClass, c.name]),
);

export const WOTLK_CLASS_SLUG_BY_KEY = new Map<string, WotlkClassSlug>();

for (const cls of WOTLK_CLASSES) {
  WOTLK_CLASS_SLUG_BY_KEY.set(cls.wotlkClass.toLowerCase(), cls.wotlkClass);
  WOTLK_CLASS_SLUG_BY_KEY.set(cls.name.toLowerCase(), cls.wotlkClass);
}

export function resolveWotlkClassSlug(wotlkClass: string): string {
  const lower = wotlkClass.trim().toLowerCase();
  return WOTLK_CLASS_SLUG_BY_KEY.get(lower) ?? lower;
}

export function normalizeAbilityWotlkClass(
  wotlkClass: string | undefined,
): string {
  const trimmed = wotlkClass?.trim();
  if (!trimmed) return "unknown";
  return resolveWotlkClassSlug(trimmed);
}

export function displayWotlkClassName(wotlkClass: string | undefined): string {
  if (!wotlkClass?.trim()) return "Unknown";
  const slug = normalizeAbilityWotlkClass(wotlkClass);
  const known = WOTLK_CLASS_NAME_BY_SLUG.get(slug as WotlkClassSlug);
  if (known) return known;
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function isHiddenWotlkClass(wotlkClass: string): boolean {
  return HIDDEN_WOTLK_CLASS_SLUGS.has(normalizeAbilityWotlkClass(wotlkClass));
}

export function isPlayableWotlkClass(
  wotlkClass: string,
): wotlkClass is PlayableWotlkClassSlug {
  return !isHiddenWotlkClass(wotlkClass);
}
