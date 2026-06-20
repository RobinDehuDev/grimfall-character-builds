import type { WotlkClassSlug } from "./talents";

/** Maps WoW skill line ID → talent tree index (0–2) per class. */
export const SKILL_LINE_TREE_INDEX: Record<
  WotlkClassSlug,
  Record<number, number>
> = {
  "death-knight": { 770: 0, 771: 1, 772: 2 },
  druid: { 573: 0, 574: 1, 134: 2 },
  hunter: { 50: 0, 51: 1, 163: 2 },
  mage: { 237: 0, 8: 1, 6: 2 },
  paladin: { 184: 0, 267: 1, 594: 2 },
  priest: { 56: 0, 78: 1, 613: 2 },
  rogue: { 38: 0, 39: 1, 253: 2 },
  shaman: { 373: 0, 374: 1, 375: 2 },
  warlock: { 354: 0, 593: 1, 355: 2 },
  warrior: { 26: 0, 256: 1, 257: 2 },
};

/** Talent tree display names by index, aligned with WotLK talent trees. */
export const CLASS_SPEC_NAMES: Record<WotlkClassSlug, readonly [string, string, string]> = {
  "death-knight": ["Blood", "Frost", "Unholy"],
  druid: ["Balance", "Feral", "Restoration"],
  hunter: ["Beast Mastery", "Marksmanship", "Survival"],
  mage: ["Arcane", "Fire", "Frost"],
  paladin: ["Holy", "Protection", "Retribution"],
  priest: ["Discipline", "Holy", "Shadow"],
  rogue: ["Assassination", "Combat", "Subtlety"],
  shaman: ["Elemental", "Enhancement", "Restoration"],
  warlock: ["Affliction", "Demonology", "Destruction"],
  warrior: ["Arms", "Fury", "Protection"],
};

export function isWotlkClassSlug(value: string): value is WotlkClassSlug {
  return value in SKILL_LINE_TREE_INDEX;
}

export function treeIndexForSkillLine(
  wotlkClass: WotlkClassSlug,
  skillLineId: number,
): number | undefined {
  return SKILL_LINE_TREE_INDEX[wotlkClass][skillLineId];
}

export function specNameForSkillLine(
  wotlkClass: WotlkClassSlug,
  skillLineId: number,
): string | undefined {
  const treeIndex = treeIndexForSkillLine(wotlkClass, skillLineId);
  if (treeIndex === undefined) return undefined;
  return CLASS_SPEC_NAMES[wotlkClass][treeIndex];
}

export function primarySkillLineId(
  skillLineIds: number[] | undefined,
): number | undefined {
  if (!skillLineIds?.length) return undefined;
  return skillLineIds[0];
}
