#!/usr/bin/env node
/**
 * Fetches WotLK class spellbook abilities from Wowhead listview + tooltip API
 * and writes data/wotlk-abilities.json for seeding Convex.
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = join(__dirname, "../data/wotlk-abilities.json");
const WOWHEAD_BASE = "https://www.wowhead.com/wotlk/spells/abilities";
const TOOLTIP_BASE = "https://nether.wowhead.com/wotlk/tooltip/spell";
const USER_AGENT = "Mozilla/5.0 (compatible; gimfall-character-builds/1.0)";

const WOTLK_CLASSES = [
  { wotlkClass: "death-knight", name: "Death Knight", sortOrder: 1 },
  { wotlkClass: "druid", name: "Druid", sortOrder: 2 },
  { wotlkClass: "hunter", name: "Hunter", sortOrder: 3 },
  { wotlkClass: "mage", name: "Mage", sortOrder: 4 },
  { wotlkClass: "paladin", name: "Paladin", sortOrder: 5 },
  { wotlkClass: "priest", name: "Priest", sortOrder: 6 },
  { wotlkClass: "rogue", name: "Rogue", sortOrder: 7 },
  { wotlkClass: "shaman", name: "Shaman", sortOrder: 8 },
  { wotlkClass: "warlock", name: "Warlock", sortOrder: 9 },
  { wotlkClass: "warrior", name: "Warrior", sortOrder: 10 },
];

function parseListview(html) {
  const match = html.match(/listviewspells = (\[[\s\S]*?\]);/);
  if (!match) {
    throw new Error("Could not find listviewspells in page HTML");
  }
  // Wowhead embeds JS object literals (unquoted keys), not strict JSON.
  // eslint-disable-next-line no-new-func
  return new Function(`return ${match[1]}`)();
}

function parseRank(rank) {
  if (!rank) return 1;
  if (rank === "Passive" || rank === "Summon") return 1;
  const match = String(rank).match(/Rank (\d+)/);
  return match ? Number(match[1]) : 1;
}

function pickMaxRank(spells) {
  const byName = new Map();
  for (const spell of spells) {
    const prev = byName.get(spell.name);
    const rank = parseRank(spell.rank);
    const prevRank = prev ? parseRank(prev.rank) : 0;
    if (
      !prev ||
      rank > prevRank ||
      (rank === prevRank && spell.level > prev.level) ||
      (rank === prevRank && spell.level === prev.level && spell.id > prev.id)
    ) {
      byName.set(spell.name, spell);
    }
  }
  return [...byName.values()];
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(html) {
  return decodeHtml(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim());
}

function parseDescription(tooltipHtml) {
  const match = tooltipHtml.match(/<div class="q">([\s\S]*?)<\/div>/);
  return match ? stripTags(match[1]) : "";
}

function parseTooltipMeta(tooltipHtml) {
  const costRangeMatch = tooltipHtml.match(
    /<table width="100%"><tr><td>([^<]*)<\/td><th>([^<]*)<\/th><\/tr><\/table>/,
  );
  const cost = costRangeMatch?.[1]?.trim() || undefined;
  const range = costRangeMatch?.[2]?.trim() || undefined;

  const flat = tooltipHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");

  let castTime;
  const channeled = flat.match(/Channeled \(\d+(?:\.\d+)? sec cast\)/);
  if (channeled) {
    castTime = channeled[0];
  } else if (flat.includes("Instant cast")) {
    castTime = "Instant cast";
  } else {
    const secCast = flat.match(/(\d+(?:\.\d+)? sec cast)/);
    if (secCast) castTime = secCast[1];
  }

  const cooldownMatch = flat.match(/(\d+(?:\.\d+)? (?:sec|min) cooldown)/);
  const cooldown = cooldownMatch?.[1];

  const levelMatch = flat.match(/Requires level (\d+)/);
  const levelFromTooltip = levelMatch ? Number(levelMatch[1]) : undefined;

  return { cost, range, castTime, cooldown, levelFromTooltip };
}

async function fetchWithRetry(url, retries = 3) {
  let lastError;
  for (let attempt = 0; attempt < retries; attempt += 1) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} for ${url}`);
      }
      return res;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }
  throw lastError;
}

async function fetchTooltip(spellId) {
  const res = await fetchWithRetry(`${TOOLTIP_BASE}/${spellId}?data`);
  return res.json();
}

async function mapPool(items, fn, concurrency = 8) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

async function fetchClassAbilities(cls) {
  const res = await fetchWithRetry(`${WOWHEAD_BASE}/${cls.wotlkClass}`);
  const html = await res.text();
  const spells = parseListview(html);
  const maxRankSpells = pickMaxRank(spells);

  console.log(
    `  ${cls.name}: ${spells.length} raw → ${maxRankSpells.length} max-rank, fetching tooltips...`,
  );

  const abilities = await mapPool(maxRankSpells, async (spell) => {
    const tooltip = await fetchTooltip(spell.id);
    const meta = parseTooltipMeta(tooltip.tooltip ?? "");
    const description = parseDescription(tooltip.tooltip ?? "");
    const rank = parseRank(spell.rank);
    const isPassive = spell.rank === "Passive";

    return {
      externalId: `spell:${spell.id}`,
      spellId: spell.id,
      name: tooltip.name ?? spell.name,
      description,
      wotlkClass: cls.wotlkClass,
      levelRequirement:
        spell.level > 0 ? spell.level : (meta.levelFromTooltip ?? 0),
      icon: tooltip.icon,
      rank,
      isPassive,
      castTime: meta.castTime,
      cooldown: meta.cooldown,
      cost: meta.cost,
      range: meta.range,
      schools: spell.schools,
      skillLineIds: spell.skill?.length ? spell.skill : undefined,
    };
  });

  return abilities;
}

async function main() {
  const classes = WOTLK_CLASSES.map(({ wotlkClass, name, sortOrder }) => ({
    wotlkClass,
    name,
    sortOrder,
  }));

  const allAbilities = [];
  for (const cls of WOTLK_CLASSES) {
    const abilities = await fetchClassAbilities(cls);
    allAbilities.push(...abilities);
  }

  const output = { classes, abilities: allAbilities };
  writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`Wrote ${allAbilities.length} abilities to ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
