export const WOW_ICON_CDN = "https://wow.zamimg.com/images/wow/icons/medium";

export function talentIconUrl(icon: string) {
  return `${WOW_ICON_CDN}/${icon}.jpg`;
}

export const WOTLK_CLASS_COLORS: Record<string, string> = {
  "death-knight": "#C41E3A",
  druid: "#FF7C0A",
  hunter: "#AAD372",
  mage: "#3FC7EB",
  paladin: "#F48CBA",
  priest: "#FFFFFF",
  rogue: "#FFF468",
  shaman: "#0070DD",
  warlock: "#8788EE",
  warrior: "#C69B6D",
};

export const WOTLK_CLASS_ORDER = [
  "death-knight",
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
] as const;

export type WotlkClassSlug = (typeof WOTLK_CLASS_ORDER)[number];

/** WoWhead-style grid dimensions per talent tree (excludes tree capstone row) */
export const TALENT_GRID_ROWS = 10;
export const TALENT_GRID_COLS = 4;
export const TALENT_TREE_COUNT = 3;

export function slotsToTalentIdSet(slots: (string | null)[]): Set<string> {
  return new Set(slots.filter((id): id is string => id !== null));
}

export function talentIdSetToSlots(
  ids: ReadonlySet<string>,
  maxSlots: number,
): (string | null)[] {
  const filled = [...ids];
  const slots: (string | null)[] = filled.slice(0, maxSlots);
  while (slots.length < maxSlots) slots.push(null);
  return slots;
}
