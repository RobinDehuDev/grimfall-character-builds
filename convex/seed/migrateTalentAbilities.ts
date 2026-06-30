import { internalMutation } from "../_generated/server";
import { computeItemTags } from "../lib/tags";
import { WOTLK_CLASS_NAME_BY_SLUG } from "../lib/wotlkClasses";
import abilityData from "./data/wotlk-abilities.json";

type LegacyTalent = {
  _id: string;
  name: string;
  description: string;
  wotlkClass: string;
  treeIndex: number;
  treeName: string;
  row: number;
  col: number;
  icon: string;
  externalId?: string;
  tags: string[];
  type?: "talent" | "ability";
};

const GRID_ABILITY_EXTERNAL_IDS = new Set(
  abilityData.abilities
    .filter((a) => a.treeIndex !== undefined)
    .map((a) => a.externalId),
);

function isGridActive(talent: LegacyTalent): boolean {
  if (talent.type === "ability") return true;
  return talent.externalId !== undefined && GRID_ABILITY_EXTERNAL_IDS.has(talent.externalId);
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const talents = (await ctx.db.query("talents").collect()) as LegacyTalent[];
    const existingAbilities = await ctx.db.query("abilities").collect();
    const abilityByExternalId = new Map(
      existingAbilities
        .filter((a) => a.externalId)
        .map((a) => [a.externalId!, a]),
    );

    let migrated = 0;
    let abilitiesInserted = 0;
    let abilitiesUpdated = 0;
    let talentsRemoved = 0;

    for (const talent of talents) {
      if (!isGridActive(talent)) continue;

      const className = WOTLK_CLASS_NAME_BY_SLUG.get(talent.wotlkClass as never);
      const doc = {
        name: talent.name,
        description: talent.description,
        wotlkClass: talent.wotlkClass,
        levelRequirement: 0,
        order: 0,
        externalId: talent.externalId,
        icon: talent.icon,
        treeIndex: talent.treeIndex,
        treeName: talent.treeName,
        row: talent.row,
        col: talent.col,
        tags: computeItemTags({
          name: talent.name,
          description: talent.description,
          wotlkClass: talent.wotlkClass,
          className,
          treeName: talent.treeName,
          kind: "ability",
        }),
      };

      const key = talent.externalId;
      const existing = key ? abilityByExternalId.get(key) : undefined;
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        abilitiesUpdated += 1;
      } else {
        const id = await ctx.db.insert("abilities", doc);
        if (key) abilityByExternalId.set(key, { ...doc, _id: id } as never);
        abilitiesInserted += 1;
      }

      await ctx.db.delete(talent._id as never);
      talentsRemoved += 1;
      migrated += 1;
    }

    const builds = await ctx.db.query("builds").collect();
    let epicResCleared = 0;
    for (const build of builds) {
      if (build.epicRes.length > 0) {
        await ctx.db.patch(build._id, { epicRes: [] });
        epicResCleared += 1;
      }
    }

    return {
      migrated,
      abilitiesInserted,
      abilitiesUpdated,
      talentsRemoved,
      epicResCleared,
    };
  },
});
