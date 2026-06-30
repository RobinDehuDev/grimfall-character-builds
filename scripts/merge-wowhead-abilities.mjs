#!/usr/bin/env node
/**
 * Appends abilities present in wotlk-abilities.json but missing from
 * grimfall-abilities.json. Marks them addedFromWowhead + hidden.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GRIMFALL = join(ROOT, "convex/seed/data/grimfall-abilities.json");
const WOTLK = join(ROOT, "convex/seed/data/wotlk-abilities.json");

const PLAYABLE_CLASS_SLUGS = new Set([
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
]);

const CLASS_SPEC_NAMES = {
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

const SKILL_LINE_TREE_INDEX = {
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

function pickOptional(value) {
  return value === undefined || value === null ? undefined : value;
}

function treeIndexFromSkillLines(wotlkClass, skillLineIds) {
  if (!skillLineIds?.length) return undefined;
  const map = SKILL_LINE_TREE_INDEX[wotlkClass];
  if (!map) return undefined;
  for (const id of skillLineIds) {
    if (map[id] !== undefined) return map[id];
  }
  return undefined;
}

function treeNameFromIndex(wotlkClass, treeIndex) {
  const specs = CLASS_SPEC_NAMES[wotlkClass];
  if (!specs || treeIndex === undefined) return undefined;
  return specs[treeIndex];
}

function classNameKey(ability) {
  return `${ability.wotlkClass}|${ability.name.toLowerCase()}`;
}

function isAlreadyPresent(wotlkRow, grimSpellIds, grimClassNames) {
  if (wotlkRow.spellId != null && grimSpellIds.has(wotlkRow.spellId)) {
    return true;
  }
  return grimClassNames.has(classNameKey(wotlkRow));
}

function wotlkToGrimfallRow(wotlkRow) {
  const treeIndex =
    wotlkRow.treeIndex ??
    treeIndexFromSkillLines(wotlkRow.wotlkClass, wotlkRow.skillLineIds);
  const treeName =
    wotlkRow.treeName ??
    treeNameFromIndex(wotlkRow.wotlkClass, treeIndex);

  const ability = {
    externalId: wotlkRow.externalId,
    spellId: pickOptional(wotlkRow.spellId),
    name: wotlkRow.name,
    description: wotlkRow.description ?? "",
    wotlkClass: wotlkRow.wotlkClass,
    levelRequirement: wotlkRow.levelRequirement ?? 0,
    treeName,
    treeIndex,
    icon: pickOptional(wotlkRow.icon),
    schools: pickOptional(wotlkRow.schools),
    skillLineIds: pickOptional(wotlkRow.skillLineIds),
    rank: pickOptional(wotlkRow.rank),
    isPassive: pickOptional(wotlkRow.isPassive),
    castTime: pickOptional(wotlkRow.castTime),
    cooldown: pickOptional(wotlkRow.cooldown),
    cost: pickOptional(wotlkRow.cost),
    range: pickOptional(wotlkRow.range),
    row: pickOptional(wotlkRow.row),
    col: pickOptional(wotlkRow.col),
    addedFromWowhead: true,
    hidden: true,
  };

  return ability;
}

function main() {
  const grimfallData = JSON.parse(readFileSync(GRIMFALL, "utf8"));
  const wotlkData = JSON.parse(readFileSync(WOTLK, "utf8"));

  const grimSpellIds = new Set(
    grimfallData.abilities
      .map((a) => a.spellId)
      .filter((id) => id != null),
  );
  const grimClassNames = new Set(
    grimfallData.abilities.map((a) => classNameKey(a)),
  );

  const merged = [];
  const byClass = {};
  for (const wotlkRow of wotlkData.abilities) {
    if (isAlreadyPresent(wotlkRow, grimSpellIds, grimClassNames)) continue;
    const row = wotlkToGrimfallRow(wotlkRow);
    merged.push(row);
    grimClassNames.add(classNameKey(row));
    if (row.spellId != null) grimSpellIds.add(row.spellId);
    byClass[row.wotlkClass] = (byClass[row.wotlkClass] ?? 0) + 1;
  }

  const abilities = [...grimfallData.abilities, ...merged];
  abilities.sort((a, b) => (a.spellId ?? 0) - (b.spellId ?? 0));

  writeFileSync(
    GRIMFALL,
    JSON.stringify({ abilities }, null, 2) + "\n",
  );

  console.log(
    `Merged ${merged.length} Wowhead abilities into ${GRIMFALL}`,
    `(total ${abilities.length})`,
  );
  console.log("By class:", byClass);
}

main();
