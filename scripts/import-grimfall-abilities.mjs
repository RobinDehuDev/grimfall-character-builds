#!/usr/bin/env node
/**
 * Reads abilities.json (grimfall export), enriches from wotlk-abilities.json
 * (icon, schools, skill lines, cast metadata), writes grimfall-abilities.json.
 * Classification (priority): (DND)|{DND} in name or subclass → dnd; "racial" in subclass → racials;
 * Engineering subclass → profession; no spec treeIndex → general;
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SOURCE = join(ROOT, "abilities.json");
const WOTLK = join(ROOT, "convex/seed/data/wotlk-abilities.json");
const OUT = join(ROOT, "convex/seed/data/grimfall-abilities.json");

const CLASS_NAME_TO_SLUG = {
  "Death Knight": "death-knight",
  Druid: "druid",
  Hunter: "hunter",
  Mage: "mage",
  Paladin: "paladin",
  Priest: "priest",
  Rogue: "rogue",
  Shaman: "shaman",
  Warlock: "warlock",
  Warrior: "warrior",
};

const HIDDEN_CLASS_SLUGS = new Set(["racials", "dnd", "unknown", "profession", "general"]);
const PLAYABLE_CLASS_SLUGS = new Set(Object.values(CLASS_NAME_TO_SLUG));

function isDndLabel(value) {
  return /[\({]DND[\)}]/i.test(value ?? "");
}

function isRacialSubclass(subclass) {
  return /racial/i.test(subclass ?? "");
}

function isProfessionSubclass(subclass) {
  return /^engineering$/i.test(subclass?.trim() ?? "");
}

function applyGeneralClassIfNeeded(ability, classField) {
  if (HIDDEN_CLASS_SLUGS.has(ability.wotlkClass)) return;
  if (ability.treeIndex != null) return;
  if (!PLAYABLE_CLASS_SLUGS.has(ability.wotlkClass)) return;
  const slugCount = (classField ?? "")
    .split(",")
    .map((part) => wotlkSlug(part.trim()))
    .filter(Boolean).length;
  if (slugCount > 1) {
    ability.wotlkClass = "general";
  }
}

function resolveWotlkClass(row) {
  if (isDndLabel(row.name) || isDndLabel(row.subclass)) return "dnd";
  if (isRacialSubclass(row.subclass)) return "racials";
  if (isProfessionSubclass(row.subclass)) return "profession";
  if (row.class == null) return "unknown";
  const slug = wotlkSlug(row.class);
  return slug ?? "unknown";
}

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

const SUBCLASS_SPEC_ALIASES = {
  "Feral Combat": "Feral",
  Defense: "Protection",
  "Shadow Magic": "Shadow",
  "Elemental Combat": "Elemental",
};

function wotlkSlug(classField) {
  const primary = classField.split(",")[0]?.trim();
  return primary ? CLASS_NAME_TO_SLUG[primary] : undefined;
}

function treeIndexFromSubclass(wotlkClass, subclass) {
  if (HIDDEN_CLASS_SLUGS.has(wotlkClass)) return undefined;
  if (!subclass) return undefined;
  const specs = CLASS_SPEC_NAMES[wotlkClass];
  if (!specs) return undefined;
  const normalized = SUBCLASS_SPEC_ALIASES[subclass] ?? subclass;
  const idx = specs.findIndex(
    (name) => name.toLowerCase() === normalized.toLowerCase(),
  );
  return idx >= 0 ? idx : undefined;
}

function treeIndexFromSkillLines(wotlkClass, skillLineIds) {
  if (HIDDEN_CLASS_SLUGS.has(wotlkClass)) return undefined;
  if (!skillLineIds?.length) return undefined;
  const map = SKILL_LINE_TREE_INDEX[wotlkClass];
  if (!map) return undefined;
  for (const id of skillLineIds) {
    if (map[id] !== undefined) return map[id];
  }
  return undefined;
}

function buildWotlkIndexes(wotlkAbilities) {
  const bySpellId = new Map();
  const byClassName = new Map();
  for (const row of wotlkAbilities) {
    if (row.spellId != null) bySpellId.set(row.spellId, row);
    const key = `${row.wotlkClass}|${row.name.toLowerCase()}`;
    if (!byClassName.has(key)) byClassName.set(key, row);
  }
  return { bySpellId, byClassName };
}

function findWotlkMatch(indexes, grimfallRow) {
  return (
    indexes.bySpellId.get(grimfallRow.spellId) ??
    indexes.byClassName.get(
      `${grimfallRow.wotlkClass}|${grimfallRow.name.toLowerCase()}`,
    )
  );
}

function pickOptional(source, key) {
  const value = source?.[key];
  return value === undefined || value === null ? undefined : value;
}

function enrichFromWotlk(grimfallRow, wotlkRow) {
  const treeName = grimfallRow.subclass ?? undefined;
  const treeIndex =
    treeIndexFromSubclass(grimfallRow.wotlkClass, grimfallRow.subclass) ??
    pickOptional(wotlkRow, "treeIndex") ??
    treeIndexFromSkillLines(grimfallRow.wotlkClass, wotlkRow?.skillLineIds);

  return {
    externalId: `spell:${grimfallRow.id}`,
    spellId: grimfallRow.id,
    name: grimfallRow.name,
    description: grimfallRow.description ?? "",
    wotlkClass: grimfallRow.wotlkClass,
    levelRequirement: grimfallRow.rank1Level ?? 0,
    treeName,
    treeIndex,
    icon: pickOptional(wotlkRow, "icon"),
    schools: pickOptional(wotlkRow, "schools"),
    skillLineIds: pickOptional(wotlkRow, "skillLineIds"),
    rank: pickOptional(wotlkRow, "rank"),
    isPassive: pickOptional(wotlkRow, "isPassive"),
    castTime: pickOptional(wotlkRow, "castTime"),
    cooldown: pickOptional(wotlkRow, "cooldown"),
    cost: pickOptional(wotlkRow, "cost"),
    range: pickOptional(wotlkRow, "range"),
    row: pickOptional(wotlkRow, "row"),
    col: pickOptional(wotlkRow, "col"),
  };
}

function abilityDedupeKey(ability) {
  return `${ability.wotlkClass}|${ability.name.toLowerCase()}`;
}

function pickFirstRank(a, b) {
  if (a.levelRequirement !== b.levelRequirement) {
    return a.levelRequirement < b.levelRequirement ? a : b;
  }
  const rankA = a.rank ?? Number.MAX_SAFE_INTEGER;
  const rankB = b.rank ?? Number.MAX_SAFE_INTEGER;
  if (rankA !== rankB) {
    return rankA < rankB ? a : b;
  }
  return a.spellId < b.spellId ? a : b;
}

function dedupeRankDuplicates(abilities) {
  const byKey = new Map();
  for (const ability of abilities) {
    const key = abilityDedupeKey(ability);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, ability);
      continue;
    }
    byKey.set(key, pickFirstRank(existing, ability));
  }
  return [...byKey.values()].map((ability) => ({
    ...ability,
    rank: ability.rank != null ? 1 : undefined,
  }));
}

function main() {
  const raw = JSON.parse(readFileSync(SOURCE, "utf8"));
  const wotlkData = JSON.parse(readFileSync(WOTLK, "utf8"));
  const wotlkIndexes = buildWotlkIndexes(wotlkData.abilities);

  const skipped = { importUnknown: 0 };
  const classified = { racials: 0, dnd: 0, unknown: 0, profession: 0, general: 0, playable: 0 };
  const abilities = [];
  const stats = {
    wotlkMatched: 0,
    withIcon: 0,
    withSchools: 0,
    withTreeIndex: 0,
    withTreeName: 0,
  };

  for (const row of raw) {
    const wotlkClass = resolveWotlkClass(row);
    if (wotlkClass === "unknown" && process.env.IMPORT_UNKNOWN === "0") {
      skipped.importUnknown += 1;
      continue;
    }

    const grimfallRow = {
      id: row.id,
      name: row.name,
      description: row.description,
      wotlkClass,
      rank1Level: row.rank1Level,
      subclass: row.subclass,
    };
    const wotlkRow = findWotlkMatch(wotlkIndexes, grimfallRow);
    if (wotlkRow) stats.wotlkMatched += 1;

    const ability = enrichFromWotlk(grimfallRow, wotlkRow);
    applyGeneralClassIfNeeded(ability, row.class);
    if (HIDDEN_CLASS_SLUGS.has(ability.wotlkClass)) classified[ability.wotlkClass] += 1;
    else classified.playable += 1;
    abilities.push(ability);
    if (ability.icon) stats.withIcon += 1;
    if (ability.schools != null) stats.withSchools += 1;
    if (ability.treeIndex != null) stats.withTreeIndex += 1;
    if (ability.treeName) stats.withTreeName += 1;
  }

  const beforeDedupe = abilities.length;
  const deduped = dedupeRankDuplicates(abilities);
  deduped.sort((a, b) => a.spellId - b.spellId);

  writeFileSync(OUT, JSON.stringify({ abilities: deduped }, null, 2) + "\n");

  console.log(
    `Wrote ${deduped.length} abilities to ${OUT}`,
    `(removed ${beforeDedupe - deduped.length} duplicate ranks,`,
    `skipped ${skipped.importUnknown} unknown when IMPORT_UNKNOWN=0)`,
  );
  console.log("Classification:", classified);
  console.log("Enrichment:", stats);
}

main();
