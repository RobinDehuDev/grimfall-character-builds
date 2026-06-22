#!/usr/bin/env node
/**
 * Moves type:"ability" rows from wotlk-talents.json into wotlk-abilities.json.
 * Passives stay in talents (without a type field).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const TALENT_PATHS = [
  join(ROOT, "data/wotlk-talents.json"),
  join(ROOT, "convex/seed/data/wotlk-talents.json"),
];
const ABILITY_PATHS = [
  join(ROOT, "data/wotlk-abilities.json"),
  join(ROOT, "convex/seed/data/wotlk-abilities.json"),
];

function gridToAbility(row) {
  const { type: _type, ...rest } = row;
  return {
    ...rest,
    levelRequirement: 0,
  };
}

function splitTalents(talentData) {
  const passives = [];
  const gridAbilities = [];

  for (const row of talentData.talents) {
    if (row.type === "ability") {
      gridAbilities.push(gridToAbility(row));
    } else {
      const { type: _type, ...rest } = row;
      passives.push(rest);
    }
  }

  return {
    ...talentData,
    talents: passives,
    _gridAbilities: gridAbilities,
  };
}

function mergeAbilities(abilityData, gridAbilities) {
  const byExternalId = new Map(
    abilityData.abilities.map((a) => [a.externalId, a]),
  );

  let added = 0;
  let updated = 0;

  for (const grid of gridAbilities) {
    const existing = byExternalId.get(grid.externalId);
    if (existing) {
      byExternalId.set(grid.externalId, { ...existing, ...grid });
      updated += 1;
    } else {
      byExternalId.set(grid.externalId, grid);
      added += 1;
    }
  }

  return {
    data: {
      ...abilityData,
      abilities: [...byExternalId.values()].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    },
    added,
    updated,
  };
}

function main() {
  const sourceTalents = JSON.parse(readFileSync(TALENT_PATHS[0], "utf8"));
  const { _gridAbilities: gridAbilities, ...talentOutput } = splitTalents(sourceTalents);

  console.log(
    `Split ${sourceTalents.talents.length} rows → ${talentOutput.talents.length} talents, ${gridAbilities.length} grid abilities`,
  );

  for (const path of TALENT_PATHS) {
    writeFileSync(path, JSON.stringify(talentOutput, null, 2) + "\n");
    console.log(`Wrote ${path}`);
  }

  const sourceAbilities = JSON.parse(readFileSync(ABILITY_PATHS[0], "utf8"));
  const { data: abilityOutput, added, updated } = mergeAbilities(
    sourceAbilities,
    gridAbilities,
  );

  console.log(
    `Abilities: ${sourceAbilities.abilities.length} → ${abilityOutput.abilities.length} (+${added} new, ${updated} merged)`,
  );

  for (const path of ABILITY_PATHS) {
    writeFileSync(path, JSON.stringify(abilityOutput, null, 2) + "\n");
    console.log(`Wrote ${path}`);
  }
}

main();
