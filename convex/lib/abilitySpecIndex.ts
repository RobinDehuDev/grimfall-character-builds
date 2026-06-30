/** Talent tree display names by index, aligned with WotLK talent trees. */
export const CLASS_SPEC_NAMES: Record<string, readonly [string, string, string]> = {
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

/** Maps WoW skill line ID → talent tree index (0–2) per class. */
export const SKILL_LINE_TREE_INDEX: Record<string, Record<number, number>> = {
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

/** Grimfall subclass labels that differ from talent tree names. */
export const SUBCLASS_SPEC_ALIASES: Record<string, string> = {
  "Feral Combat": "Feral",
  Defense: "Protection",
  "Shadow Magic": "Shadow",
  "Elemental Combat": "Elemental",
};

export function treeIndexForSkillLine(
  wotlkClass: string,
  skillLineId: number,
): number | undefined {
  return SKILL_LINE_TREE_INDEX[wotlkClass]?.[skillLineId];
}

export function treeIndexFromSkillLines(
  wotlkClass: string,
  skillLineIds: number[] | undefined,
): number | undefined {
  if (!skillLineIds?.length) return undefined;
  const map = SKILL_LINE_TREE_INDEX[wotlkClass];
  if (!map) return undefined;
  for (const id of skillLineIds) {
    if (map[id] !== undefined) return map[id];
  }
  return undefined;
}

export function treeIndexFromSubclass(
  wotlkClass: string,
  subclass: string | undefined,
): number | undefined {
  if (!subclass) return undefined;
  const specs = CLASS_SPEC_NAMES[wotlkClass];
  if (!specs) return undefined;
  const normalized = SUBCLASS_SPEC_ALIASES[subclass] ?? subclass;
  const idx = specs.findIndex(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );
  return idx >= 0 ? idx : undefined;
}
