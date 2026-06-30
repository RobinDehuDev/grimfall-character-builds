#!/usr/bin/env node
/**
 * Repairs wotlkClass slugs on grimfall-abilities.json using wotlk-abilities.json
 * and abilities.json source class fields.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const GRIMFALL = join(ROOT, "convex/seed/data/grimfall-abilities.json");
const WOTLK = join(ROOT, "convex/seed/data/wotlk-abilities.json");
const SOURCE = join(ROOT, "abilities.json");

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

const HIDDEN_CLASS_SLUGS = new Set([
  "racials",
  "dnd",
  "unknown",
  "profession",
  "general",
]);

function slugsFromClassField(classField) {
  if (!classField) return [];
  return classField
    .split(",")
    .map((part) => CLASS_NAME_TO_SLUG[part.trim()])
    .filter(Boolean);
}

function buildIndexes(wotlkData) {
  const bySpellId = new Map();
  const byExternalId = new Map();
  for (const row of wotlkData.abilities) {
    if (row.spellId != null) bySpellId.set(row.spellId, row.wotlkClass);
    if (row.externalId) byExternalId.set(row.externalId, row.wotlkClass);
  }
  return { bySpellId, byExternalId };
}

function resolveWotlkClass(ability, indexes, classField) {
  if (
    HIDDEN_CLASS_SLUGS.has(ability.wotlkClass) &&
    ability.wotlkClass !== "general"
  ) {
    return ability.wotlkClass;
  }

  const fromWotlk =
    (ability.spellId != null ? indexes.bySpellId.get(ability.spellId) : undefined) ??
    (ability.externalId ? indexes.byExternalId.get(ability.externalId) : undefined);
  if (fromWotlk) return fromWotlk;

  const classSlugs = slugsFromClassField(classField);
  if (classSlugs.length === 1) return classSlugs[0];
  if (classSlugs.length > 1) return "general";

  return ability.wotlkClass;
}

function main() {
  const grimfallData = JSON.parse(readFileSync(GRIMFALL, "utf8"));
  const wotlkData = JSON.parse(readFileSync(WOTLK, "utf8"));
  const indexes = buildIndexes(wotlkData);

  const sourceBySpellId = new Map();
  if (existsSync(SOURCE)) {
    const raw = JSON.parse(readFileSync(SOURCE, "utf8"));
    for (const row of raw) {
      sourceBySpellId.set(row.id, row.class);
    }
  }

  let updated = 0;
  const byFromTo = {};

  for (const ability of grimfallData.abilities) {
    const classField = sourceBySpellId.get(ability.spellId);
    const resolved = resolveWotlkClass(ability, indexes, classField);
    if (resolved === ability.wotlkClass) continue;

    const key = `${ability.wotlkClass} -> ${resolved}`;
    byFromTo[key] = (byFromTo[key] ?? 0) + 1;
    ability.wotlkClass = resolved;
    updated += 1;
  }

  writeFileSync(GRIMFALL, JSON.stringify(grimfallData, null, 2) + "\n");

  console.log(`Updated wotlkClass on ${updated} abilities in ${GRIMFALL}`);
  console.log("Changes:", byFromTo);
}

main();
