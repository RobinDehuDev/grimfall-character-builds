#!/usr/bin/env node
/**
 * Fetches WotLK 3.3.5 talent data from OlegKireev/talent-calc mocks
 * and writes data/wotlk-talents.json for seeding Convex.
 *
 * Tree-final talents (bottom row of each tree) are exported as capstones.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/wotlk-talents.json");
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
        capstones.push(record);
      } else {
        talents.push(record);
      }
    }
  });

  return { talents, capstones };
}

async function main() {
  const classes = WOTLK_CLASSES.map(({ wotlkClass, name, sortOrder }) => ({
    wotlkClass,
    name,
    sortOrder,
  }));

  const allTalents = [];
  const allCapstones = [];
  let abilityCount = 0;
  let passiveCount = 0;
  for (const cls of WOTLK_CLASSES) {
    const { talents, capstones } = await fetchClassTalents(cls);
    for (const t of talents) {
      if (t.type === "ability") abilityCount += 1;
      else passiveCount += 1;
    }
    console.log(
      `${cls.name}: ${talents.length} talents (${talents.filter((t) => t.type === "ability").length} abilities), ${capstones.length} capstones`,
    );
    allTalents.push(...talents);
    allCapstones.push(...capstones);
  }

  const output = { classes, talents: allTalents, capstones: allCapstones };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(
    `Wrote ${allTalents.length} talents (${abilityCount} abilities, ${passiveCount} passives) and ${allCapstones.length} capstones to ${OUT_PATH}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
