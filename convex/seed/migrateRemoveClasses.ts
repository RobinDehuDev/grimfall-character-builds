import { internalMutation } from "../_generated/server";

type LegacyBuild = {
  _id: string;
  classId?: string;
};

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const builds = await ctx.db.query("builds").collect();
    let buildsPatched = 0;

    for (const build of builds as LegacyBuild[]) {
      if (build.classId !== undefined) {
        await ctx.db.patch(build._id as never, { classId: undefined } as never);
        buildsPatched += 1;
      }
    }

    return {
      buildsPatched,
    };
  },
});
