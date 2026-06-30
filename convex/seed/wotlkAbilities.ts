import { internalMutation } from "../_generated/server";
import { computeItemTags } from "../lib/tags";
import abilityData from "./data/wotlk-abilities.json";

type AbilityRow = (typeof abilityData.abilities)[number];

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const classNameBySlug = new Map(
      abilityData.classes.map((c) => [c.wotlkClass, c.name]),
    );

    const existing = await ctx.db.query("abilities").collect();
    const existingByExternalId = new Map<string, (typeof existing)[number]>();
    for (const item of existing) {
      if (item.externalId) {
        existingByExternalId.set(item.externalId, item);
      }
    }

    const incomingExternalIds = new Set<string>();
    let inserted = 0;
    let updated = 0;

    for (const ability of abilityData.abilities as AbilityRow[]) {
      incomingExternalIds.add(ability.externalId);
      const className = classNameBySlug.get(ability.wotlkClass);
      const doc = {
        name: ability.name,
        description: ability.description,
        wotlkClass: ability.wotlkClass,
        levelRequirement: ability.levelRequirement ?? 0,
        order: 0,
        externalId: ability.externalId,
        icon: ability.icon,
        spellId: ability.spellId,
        rank: ability.rank,
        isPassive: ability.isPassive,
        castTime: ability.castTime,
        cooldown: ability.cooldown,
        cost: ability.cost,
        range: ability.range,
        schools: ability.schools,
        skillLineIds: ability.skillLineIds,
        treeIndex: ability.treeIndex,
        treeName: ability.treeName,
        row: ability.row,
        col: ability.col,
        tags: computeItemTags({
          name: ability.name,
          description: ability.description,
          wotlkClass: ability.wotlkClass,
          className,
          treeName: ability.treeName,
          kind: "ability",
        }),
      };

      const existingRow = existingByExternalId.get(ability.externalId);
      if (existingRow) {
        await ctx.db.patch(existingRow._id, doc);
        updated += 1;
      } else {
        await ctx.db.insert("abilities", doc);
        inserted += 1;
      }
    }

    let removed = 0;
    for (const item of existing) {
      if (item.externalId && !incomingExternalIds.has(item.externalId)) {
        await ctx.db.delete(item._id);
        removed += 1;
      }
    }

    const byClass = new Map<string, number>();
    for (const ability of abilityData.abilities) {
      byClass.set(
        ability.wotlkClass,
        (byClass.get(ability.wotlkClass) ?? 0) + 1,
      );
    }

    const gridCount = abilityData.abilities.filter(
      (a) => a.treeIndex !== undefined,
    ).length;

    return {
      inserted,
      updated,
      removed,
      total: abilityData.abilities.length,
      gridAbilities: gridCount,
      byClass: Object.fromEntries(byClass),
    };
  },
});
