#!/usr/bin/env node
/**
 * Fetches WotLK 3.3.5 talent data from OlegKireev/talent-calc mocks
 * and writes data/wotlk-talents.json (passives + capstones only).
 * Grid actives are merged into data/wotlk-abilities.json.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TALENTS_OUT = join(__dirname, "../data/wotlk-talents.json");
const ABILITIES_PATH = join(__dirname, "../data/wotlk-abilities.json");
const BASE_URL =
  "https://raw.githubusercontent.com/OlegKireev/talent-calc/master/src/mocks";

const WOTLK_CLASSES = [
  { wotlkClass: "death-knight", file: "deathknight", name: "Death Knight", sortOrder: 1 },
  { wotlkClass: "druid", file: "druid", name: "Druid", sortOrder: 2 },
  { wotlkClass: "hunter", file: "hunter", name: "Hunter", sortOrder: 3 },
  { wotlkClass: "mage", file: "mage", name: "Mage", sortOrder: 4 },
  { wotlkClass: "paladin", file: "paladin", name: "Paladin", sortOrder: 5 },
  { wotlkClass: "priest", file: "priest", name: "Priest", sortOrder: 6 },
  { wotlkClass: "rogue", file: "rogue", name: "Rogue", sortOrder: 7 },
  { wotlkClass: "shaman", file: "shaman", name: "Shaman", sortOrder: 8 },
  { wotlkClass: "warlock", file: "warlock", name: "Warlock", sortOrder: 9 },
  { wotlkClass: "warrior", file: "warrior", name: "Warrior", sortOrder: 10 },
];

function capitalizeTreeName(slug) {
  return slug
    .split(/[\s_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function iconFromUrl(url) {
  const match = String(url).match(/\/([^/]+)\.jpg$/i);
  return match ? match[1] : "inv_misc_questionmark";
}

function parseMockFile(content) {
  const js = content
    .replace(/^import.*$/gm, "")
    .replace(/export const \w+(?::\s*[^=]+)?\s*=\s*/, "return ");
  const RESOURCE_URI = "";
  // eslint-disable-next-line no-new-func
  return new Function("RESOURCE_URI", js)(RESOURCE_URI);
}

function gridEntryType(talent) {
  const isActiveSpell =
    talent.cooldown !== undefined ||
    talent.castDuration !== undefined ||
    talent.costs !== undefined;
  return isActiveSpell ? "ability" : "talent";
}

function buildTalentRecord(talent, cls, treeIndex, treeName) {
  const maxRank =
    talent.max ?? Math.max(...Object.keys(talent.description).map(Number));
  const description = talent.description[maxRank] ?? talent.description[1] ?? "";
  return {
    externalId: talent.id,
    name: talent.title,
    description,
    wotlkClass: cls.wotlkClass,
    treeIndex,
    treeName,
    row: talent.tier,
    col: talent.column,
    icon: iconFromUrl(talent.icon),
    type: gridEntryType(talent),
  };
}

function toPassiveRecord(record) {
  const { type: _type, ...rest } = record;
  return rest;
}

function toGridAbility(record) {
  const { type: _type, ...rest } = record;
  return { ...rest, levelRequirement: 0 };
}

async function fetchClassTalents(cls) {
  const res = await fetch(`${BASE_URL}/${cls.file}.ts`);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${cls.file}.ts: ${res.status}`);
  }
  const content = await res.text();
  const trees = parseMockFile(content);
  const talents = [];
  const capstones = [];

  trees.forEach((tree, treeIndex) => {
    const treeName = capitalizeTreeName(tree.title);
    const records = tree.talents.map((talent) =>
      buildTalentRecord(talent, cls, treeIndex, treeName),
    );
    const maxRow = Math.max(...records.map((r) => r.row));

    for (const record of records) {
      if (record.row === maxRow) {
        capstones.push(toPassiveRecord(record));
      } else {
        talents.push(record);
      }
    }
  });

  return { talents, capstones };
}

function mergeGridIntoAbilities(abilityData, gridAbilities) {
  const byExternalId = new Map(
    abilityData.abilities.map((a) => [a.externalId, a]),
  );
  for (const grid of gridAbilities) {
    const existing = byExternalId.get(grid.externalId);
    byExternalId.set(
      grid.externalId,
      existing ? { ...existing, ...grid } : grid,
    );
  }
  return {
    ...abilityData,
    abilities: [...byExternalId.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  };
}

async function main() {
  const classes = WOTLK_CLASSES.map(({ wotlkClass, name, sortOrder }) => ({
    wotlkClass,
    name,
    sortOrder,
  }));

  const allRows = [];
  const allCapstones = [];
  let abilityCount = 0;
  let passiveCount = 0;

  for (const cls of WOTLK_CLASSES) {
    const { talents, capstones } = await fetchClassTalents(cls);
    const gridInClass = talents.filter((t) => t.type === "ability").length;
    const passivesInClass = talents.filter((t) => t.type === "talent").length;
    abilityCount += gridInClass;
    passiveCount += passivesInClass;
    console.log(
      `${cls.name}: ${passivesInClass} talents, ${gridInClass} grid abilities, ${capstones.length} capstones`,
    );
    allRows.push(...talents);
    allCapstones.push(...capstones);
  }

  const passives = allRows
    .filter((r) => r.type === "talent")
    .map(toPassiveRecord);
  const gridAbilities = allRows
    .filter((r) => r.type === "ability")
    .map(toGridAbility);

  const talentOutput = { classes, talents: passives, capstones: allCapstones };
  writeFileSync(TALENTS_OUT, JSON.stringify(talentOutput, null, 2) + "\n");
  console.log(
    `Wrote ${passives.length} talents and ${allCapstones.length} capstones to ${TALENTS_OUT}`,
  );

  let abilityData = { classes, abilities: [] };
  try {
    abilityData = JSON.parse(readFileSync(ABILITIES_PATH, "utf8"));
  } catch {
    console.warn(`No existing ${ABILITIES_PATH}; creating abilities file with grid actives only`);
  }

  const merged = mergeGridIntoAbilities(abilityData, gridAbilities);
  writeFileSync(ABILITIES_PATH, JSON.stringify(merged, null, 2) + "\n");
  console.log(
    `Merged ${gridAbilities.length} grid abilities into ${ABILITIES_PATH} (${merged.abilities.length} total)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
