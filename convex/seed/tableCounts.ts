import { internalQuery } from "../_generated/server";

export const tableCounts = internalQuery({
  args: {},
  handler: async (ctx) => {
    const [abilities, talents, capstones, runics, builds] = await Promise.all([
      ctx.db.query("abilities").collect(),
      ctx.db.query("talents").collect(),
      ctx.db.query("capstones").collect(),
      ctx.db.query("runicEnhancements").collect(),
      ctx.db.query("builds").collect(),
    ]);
    return {
      abilities: abilities.length,
      talents: talents.length,
      capstones: capstones.length,
      runicEnhancements: runics.length,
      builds: builds.length,
    };
  },
});
