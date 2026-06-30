import { internalMutation } from "../_generated/server";
import {
  buildProbablyTalentIndexes,
  isProbablyTalent,
  PROBABLY_TALENT_SKIP_CLASS,
} from "../lib/probablyTalent";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const indexes = buildProbablyTalentIndexes();
    const abilities = await ctx.db.query("abilities").collect();

    let flagged = 0;
    let cleared = 0;
    let skippedDK = 0;
    const byClass: Record<string, number> = {};

    for (const ability of abilities) {
      if (ability.wotlkClass === PROBABLY_TALENT_SKIP_CLASS) {
        skippedDK += 1;
        continue;
      }

      const shouldFlag = isProbablyTalent(ability, indexes);
      if (shouldFlag) {
        await ctx.db.patch(ability._id, {
          probablyTalent: true,
          hidden: true,
        });
        flagged += 1;
        byClass[ability.wotlkClass] = (byClass[ability.wotlkClass] ?? 0) + 1;
      } else if (ability.probablyTalent) {
        await ctx.db.patch(ability._id, { probablyTalent: false });
        cleared += 1;
      }
    }

    return { flagged, cleared, skippedDK, byClass };
  },
});
