import { internalAction } from "../_generated/server";
import { internal } from "../_generated/api";

export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<{
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
    const wotlkResult = await ctx.runMutation(internal.seed.wotlkTalents.seed, {});

    const abilitiesResult = await ctx.runMutation(internal.seed.wotlkAbilities.seed, {});

    const legendaryResult = await ctx.runMutation(internal.seed.legendaryRes.seed, {});

    const counts = await ctx.runQuery(internal.seed.tableCounts.tableCounts, {});

    return {
      wotlkResult,
      abilitiesResult,
      legendaryResult,
      counts,
    };
  },
});
