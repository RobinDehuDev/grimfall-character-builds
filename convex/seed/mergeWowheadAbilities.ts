import { internalMutation } from "../_generated/server";
import {
  CLASS_SPEC_NAMES,
  treeIndexFromSkillLines,
} from "../lib/abilitySpecIndex";
import { computeItemTags } from "../lib/tags";
import { WOTLK_CLASS_NAME_BY_SLUG } from "../lib/wotlkClasses";
import wotlkAbilityData from "./data/wotlk-abilities.json";

type WotlkAbilityRow = (typeof wotlkAbilityData.abilities)[number];

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

function classNameKey(wotlkClass: string, name: string) {
  return `${wotlkClass}|${name.toLowerCase()}`;
}

function treeNameFromIndex(
  wotlkClass: string,
  treeIndex: number | undefined,
): string | undefined {
  if (treeIndex === undefined) return undefined;
  return CLASS_SPEC_NAMES[wotlkClass]?.[treeIndex];
}

function wotlkToDoc(row: WotlkAbilityRow) {
  const treeIndex =
    row.treeIndex ?? treeIndexFromSkillLines(row.wotlkClass, row.skillLineIds);
  let wotlkClass = row.wotlkClass;
  let treeName = row.treeName ?? treeNameFromIndex(wotlkClass, treeIndex);

  if (treeIndex === undefined && PLAYABLE_CLASS_SLUGS.has(wotlkClass)) {
    wotlkClass = "general";
    treeName = undefined;
  }

  return {
    name: row.name,
    description: row.description,
    wotlkClass,
    levelRequirement: row.levelRequirement ?? 0,
    order: 0,
    externalId: row.externalId,
    icon: row.icon,
    spellId: row.spellId,
    rank: row.rank,
    isPassive: row.isPassive,
    castTime: row.castTime,
    cooldown: row.cooldown,
    cost: row.cost,
    range: row.range,
    schools: row.schools,
    skillLineIds: row.skillLineIds,
    treeIndex,
    treeName,
    row: row.row,
    col: row.col,
    hidden: true,
    addedFromWowhead: true,
  };
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("abilities").collect();

    const existingExternalIds = new Set(
      existing.map((a) => a.externalId).filter((id): id is string => !!id),
    );
    const existingSpellIds = new Set(
      existing.map((a) => a.spellId).filter((id): id is number => id != null),
    );
    const existingClassNames = new Set(
      existing.map((a) => classNameKey(a.wotlkClass, a.name)),
    );

    let inserted = 0;
    let skipped = 0;
    const byClass: Record<string, number> = {};

    for (const wotlkRow of wotlkAbilityData.abilities as WotlkAbilityRow[]) {
      if (
        (wotlkRow.spellId != null && existingSpellIds.has(wotlkRow.spellId)) ||
        existingClassNames.has(classNameKey(wotlkRow.wotlkClass, wotlkRow.name)) ||
        (wotlkRow.externalId && existingExternalIds.has(wotlkRow.externalId))
      ) {
        skipped += 1;
        continue;
      }

      const doc = wotlkToDoc(wotlkRow);
      const className = WOTLK_CLASS_NAME_BY_SLUG.get(doc.wotlkClass as never);
      await ctx.db.insert("abilities", {
        ...doc,
        tags: computeItemTags({
          name: doc.name,
          description: doc.description,
          wotlkClass: doc.wotlkClass,
          className,
          treeName: doc.treeName,
          kind: "ability",
        }),
      });

      if (doc.externalId) existingExternalIds.add(doc.externalId);
      if (doc.spellId != null) existingSpellIds.add(doc.spellId);
      existingClassNames.add(classNameKey(doc.wotlkClass, doc.name));

      inserted += 1;
      byClass[doc.wotlkClass] = (byClass[doc.wotlkClass] ?? 0) + 1;
    }

    return { inserted, skipped, byClass };
  },
});
