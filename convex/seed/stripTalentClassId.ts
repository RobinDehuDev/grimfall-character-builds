import { internalMutation } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";

type LegacyTalentDoc = Doc<"talents"> & { classId?: Id<"classes"> };

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const talents = await ctx.db.query("talents").collect();
    let stripped = 0;
    for (const talent of talents) {
      const legacy = talent as LegacyTalentDoc;
      if (legacy.classId === undefined) continue;
      const { _id, _creationTime, classId: _classId, ...fields } = legacy;
      await ctx.db.replace(talent._id, fields);
      stripped += 1;
    }
    return { total: talents.length, stripped };
  },
});
