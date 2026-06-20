import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

/** Fetch all game objects referenced by a build's slot arrays. */
export const resolveBuildItems = query({
  args: {
    talentIds: v.array(v.string()),
    abilityIds: v.array(v.string()),
    capstoneIds: v.array(v.string()),
    runicEnhancementIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const [talents, abilities, capstones, runicEnhancements] = await Promise.all([
      Promise.all(
        args.talentIds.map((id) => ctx.db.get(id as Id<"talents">)),
      ),
      Promise.all(
        args.abilityIds.map((id) => ctx.db.get(id as Id<"abilities">)),
      ),
      Promise.all(
        args.capstoneIds.map((id) => ctx.db.get(id as Id<"capstones">)),
      ),
      Promise.all(
        args.runicEnhancementIds.map((id) =>
          ctx.db.get(id as Id<"runicEnhancements">),
        ),
      ),
    ]);

    return {
      talents: talents.filter((t) => t !== null),
      abilities: abilities.filter((a) => a !== null),
      capstones: capstones.filter((c) => c !== null),
      runicEnhancements: runicEnhancements.filter((r) => r !== null),
    };
  },
});
