#!/usr/bin/env node
/**
 * Flags abilities that duplicate talent-tree entries as probablyTalent + hidden.
 * Skips death-knight (manually curated).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GRIMFALL = join(ROOT, "convex/seed/data/grimfall-abilities.json");
const TALENTS = join(ROOT, "convex/seed/data/wotlk-talents.json");
const WOTLK_ABILITIES = join(ROOT, "convex/seed/data/wotlk-abilities.json");

const SKIP_CLASS = "death-knight";

function classNameKey(wotlkClass, name) {
  return `${wotlkClass}|${name.toLowerCase()}`;
}

function buildIndexes(talentData, wotlkAbilityData) {
  const talentNameKeys = new Set();
  for (const talent of talentData.talents) {
    talentNameKeys.add(classNameKey(talent.wotlkClass, talent.name));
  }

  const gridAbilityExternalIds = new Set();
  for (const ability of wotlkAbilityData.abilities) {
    if (ability.treeIndex !== undefined && ability.externalId) {
      gridAbilityExternalIds.add(ability.externalId);
    }
  }

  return { talentNameKeys, gridAbilityExternalIds };
}

function isProbablyTalent(ability, indexes) {
  if (ability.wotlkClass === SKIP_CLASS) return false;

  if (indexes.talentNameKeys.has(classNameKey(ability.wotlkClass, ability.name))) {
    return true;
  }

  if (
    ability.externalId &&
    indexes.gridAbilityExternalIds.has(ability.externalId)
  ) {
    return true;
  }

  return false;
}

function main() {
  const grimfallData = JSON.parse(readFileSync(GRIMFALL, "utf8"));
  const talentData = JSON.parse(readFileSync(TALENTS, "utf8"));
  const wotlkAbilityData = JSON.parse(readFileSync(WOTLK_ABILITIES, "utf8"));
  const indexes = buildIndexes(talentData, wotlkAbilityData);

  let flagged = 0;
  let cleared = 0;
  let skippedDK = 0;
  const byClass = {};

  for (const ability of grimfallData.abilities) {
    if (ability.wotlkClass === SKIP_CLASS) {
      skippedDK += 1;
      continue;
    }

    const shouldFlag = isProbablyTalent(ability, indexes);
    if (shouldFlag) {
      ability.probablyTalent = true;
      ability.hidden = true;
      flagged += 1;
      byClass[ability.wotlkClass] = (byClass[ability.wotlkClass] ?? 0) + 1;
    } else {
      ability.probablyTalent = false;
      cleared += 1;
    }
  }

  writeFileSync(
    GRIMFALL,
    JSON.stringify(grimfallData, null, 2) + "\n",
  );

  console.log(`Flagged ${flagged} probably-talent abilities in ${GRIMFALL}`);
  console.log(`Cleared ${cleared}, skipped DK ${skippedDK}`);
  console.log("By class:", byClass);
}

main();
