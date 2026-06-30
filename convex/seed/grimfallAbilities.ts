import { internalMutation } from "../_generated/server";
import { computeItemTags } from "../lib/tags";
import { WOTLK_CLASS_NAME_BY_SLUG } from "../lib/wotlkClasses";
import abilityData from "./data/grimfall-abilities.json";

type AbilityRow = (typeof abilityData.abilities)[number];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("abilities").collect();
    for (const item of existing) {
      await ctx.db.delete(item._id);
    }

    let inserted = 0;
    const byClass = new Map<string, number>();

    for (const ability of abilityData.abilities as AbilityRow[]) {
      const className = WOTLK_CLASS_NAME_BY_SLUG.get(ability.wotlkClass as never);
      const doc = {
        name: ability.name,
        description: ability.description,
        wotlkClass: ability.wotlkClass,
        levelRequirement: ability.levelRequirement ?? 0,
        externalId: ability.externalId,
        spellId: ability.spellId,
        icon: ability.icon,
        schools: ability.schools,
        skillLineIds: ability.skillLineIds,
        rank: ability.rank,
        isPassive: ability.isPassive,
        castTime: ability.castTime,
        cooldown: ability.cooldown,
        cost: ability.cost,
        range: ability.range,
        treeIndex: ability.treeIndex,
        treeName: ability.treeName,
        row: ability.row,
        col: ability.col,
        hidden: ability.hidden,
        addedFromWowhead: ability.addedFromWowhead,
        probablyTalent: ability.probablyTalent,
        tags: computeItemTags({
          name: ability.name,
          description: ability.description,
          wotlkClass: ability.wotlkClass,
          className,
          treeName: ability.treeName,
          kind: "ability",
        }),
      };

      await ctx.db.insert("abilities", doc);
      inserted += 1;
      byClass.set(ability.wotlkClass, (byClass.get(ability.wotlkClass) ?? 0) + 1);
    }

    return {
      deleted: existing.length,
      inserted,
      total: abilityData.abilities.length,
      byClass: Object.fromEntries(byClass),
    };
  },
});
