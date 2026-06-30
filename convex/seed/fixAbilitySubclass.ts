import { internalMutation } from "../_generated/server";
import { CLASS_SPEC_NAMES } from "../lib/abilitySpecIndex";

const PLAYABLE_CLASSES = new Set(Object.keys(CLASS_SPEC_NAMES));

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const abilities = await ctx.db.query("abilities").collect();
    let patched = 0;
    let skipped = 0;

    for (const ability of abilities) {
      if (!PLAYABLE_CLASSES.has(ability.wotlkClass)) {
        skipped += 1;
        continue;
      }
      if (ability.treeName?.trim()) {
        skipped += 1;
        continue;
      }
      if (ability.treeIndex === undefined) {
        skipped += 1;
        continue;
      }

      const specs = CLASS_SPEC_NAMES[ability.wotlkClass];
      const treeName = specs?.[ability.treeIndex];
      if (!treeName) {
        skipped += 1;
        continue;
      }

      await ctx.db.patch(ability._id, { treeName });
      patched += 1;
    }

    return { total: abilities.length, patched, skipped };
  },
});
