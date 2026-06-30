import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<{
    migrateTalentAbilities: unknown;
    migrateRemoveClasses: unknown;
    wotlkResult: unknown;
    abilitiesResult: unknown;
    legendaryResult: unknown;
    counts: {
      abilities: number;
      talents: number;
      capstones: number;
      runicEnhancements: number;
      builds: number;
    };
  }> => {
    const migrateTalentAbilities = await ctx.runMutation(
      internal.seed.migrateTalentAbilities.run,
      {},
    );
    const migrateRemoveClasses = await ctx.runMutation(
      internal.seed.migrateRemoveClasses.run,
      {},
    );

    const wotlkResult = await ctx.runMutation(internal.seed.wotlkTalents.seed, {});

    const abilitiesResult = await ctx.runMutation(
      internal.seed.grimfallAbilities.seed,
      {},
    );

    const legendaryResult = await ctx.runMutation(internal.seed.legendaryRes.seed, {});

    const counts = await ctx.runQuery(internal.seed.tableCounts.tableCounts, {});

    return {
      migrateTalentAbilities,
      migrateRemoveClasses,
      wotlkResult,
      abilitiesResult,
      legendaryResult,
      counts,
    };
  },
});
