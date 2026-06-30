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

/**
 * Left-to-right column order as spec indices into CLASS_SPEC_NAMES.
 * Default talent-tree index order is [0, 1, 2] when omitted.
 */
export const CLASS_SPEC_COLUMN_ORDER: Partial<
  Record<WotlkClassSlug, readonly [number, number, number]>
> = {
  hunter: [1, 2, 0],
  mage: [2, 1, 0],
  paladin: [1, 2, 0],
  priest: [1, 0, 2],
  rogue: [1, 2, 0],
  warlock: [0, 2, 1],
};

const DEFAULT_SPEC_COLUMN_ORDER: readonly [number, number, number] = [0, 1, 2];

export function playableSpecColumnOrder(
  wotlkClass: WotlkClassSlug,
): readonly [number, number, number] {
  return CLASS_SPEC_COLUMN_ORDER[wotlkClass] ?? DEFAULT_SPEC_COLUMN_ORDER;
}

/** Legacy seed labels that differ from canonical spec names. */
export const SUBCLASS_SPEC_ALIASES: Record<string, string> = {
  "Feral Combat": "Feral",
  Defense: "Protection",
  "Shadow Magic": "Shadow",
  "Elemental Combat": "Elemental",
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

function normalizeSubclassName(treeName: string): string {
  const trimmed = treeName.trim();
  return SUBCLASS_SPEC_ALIASES[trimmed] ?? trimmed;
}

export function playableSubclassOptions(
  wotlkClass: string,
): readonly string[] {
  if (!isWotlkClassSlug(wotlkClass)) return [];
  const specNames = CLASS_SPEC_NAMES[wotlkClass];
  return playableSpecColumnOrder(wotlkClass).map((index) => specNames[index]);
}

export function specIndexForSubclass(
  wotlkClass: WotlkClassSlug,
  treeName: string | undefined,
): number | undefined {
  if (!treeName?.trim()) return undefined;
  const normalized = normalizeSubclassName(treeName);
  const idx = CLASS_SPEC_NAMES[wotlkClass].findIndex(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );
  return idx >= 0 ? idx : undefined;
}

export function subclassForSpecIndex(
  wotlkClass: WotlkClassSlug,
  index: number,
): string | undefined {
  return CLASS_SPEC_NAMES[wotlkClass][index];
}

export function isValidSubclassForClass(
  wotlkClass: string,
  treeName: string,
): boolean {
  if (!isWotlkClassSlug(wotlkClass)) return true;
  if (!treeName.trim()) return true;
  return specIndexForSubclass(wotlkClass, treeName) !== undefined;
}
