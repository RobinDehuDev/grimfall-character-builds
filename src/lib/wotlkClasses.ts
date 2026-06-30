export const WOTLK_PLAYABLE_CLASS_ORDER = [
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

export const HIDDEN_WOTLK_CLASS_ORDER = [
  "general",
  "racials",
  "profession",
  "dnd",
  "unknown",
] as const;

export type PlayableWotlkClassSlug = (typeof WOTLK_PLAYABLE_CLASS_ORDER)[number];
export type HiddenWotlkClassSlug = (typeof HIDDEN_WOTLK_CLASS_ORDER)[number];
export type AbilityClassSlug = PlayableWotlkClassSlug | HiddenWotlkClassSlug;

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
  racials: "#9CA3AF",
  dnd: "#6B7280",
  unknown: "#4B5563",
  profession: "#A16207",
  general: "#78716C",
};

import {
  displayWotlkClassName,
  normalizeAbilityWotlkClass,
} from "../../convex/lib/wotlkClasses";

export { displayWotlkClassName, normalizeAbilityWotlkClass };

export function isHiddenWotlkClass(wotlkClass: string): boolean {
  return HIDDEN_WOTLK_CLASS_SLUGS.has(normalizeAbilityWotlkClass(wotlkClass));
}

export function isPlayableWotlkClass(
  wotlkClass: string,
): wotlkClass is PlayableWotlkClassSlug {
  return !isHiddenWotlkClass(wotlkClass);
}

export function abilityClassTabRows(includeHidden: boolean): {
  playable: string[];
  hidden: string[];
} {
  return {
    playable: [...WOTLK_PLAYABLE_CLASS_ORDER],
    hidden: includeHidden ? [...HIDDEN_WOTLK_CLASS_ORDER] : [],
  };
}

export function abilityClassTabOrder(includeHidden: boolean): string[] {
  const { playable, hidden } = abilityClassTabRows(includeHidden);
  return [...playable, ...hidden];
}

export const HIDDEN_WOTLK_CLASS_SLUGS = new Set<string>(HIDDEN_WOTLK_CLASS_ORDER);
