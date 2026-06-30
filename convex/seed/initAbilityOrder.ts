import { internalMutation } from "../_generated/server";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const abilities = await ctx.db.query("abilities").collect();
    let patched = 0;

    for (const ability of abilities) {
      if (ability.order !== undefined) continue;
      await ctx.db.patch(ability._id, { order: 0 });
      patched += 1;
    }

    return { total: abilities.length, patched };
  },
});
