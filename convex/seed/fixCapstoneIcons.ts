import { internalMutation } from "../_generated/server";
import talentData from "./data/wotlk-talents.json";

type CapstoneRow = (typeof talentData.capstones)[number];

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const iconByExternalId = new Map<string, string>();
    for (const row of talentData.capstones as CapstoneRow[]) {
      if (row.externalId && row.icon) {
        iconByExternalId.set(row.externalId, row.icon);
      }
    }

    const capstones = await ctx.db.query("capstones").collect();
    let patched = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const capstone of capstones) {
      if (!capstone.externalId) {
        unmatched += 1;
        continue;
      }
      const icon = iconByExternalId.get(capstone.externalId);
      if (!icon) {
        unmatched += 1;
        continue;
      }
      if (capstone.icon === icon) {
        skipped += 1;
        continue;
      }
      if (capstone.icon) {
        skipped += 1;
        continue;
      }
      await ctx.db.patch(capstone._id, { icon });
      patched += 1;
    }

    return { total: capstones.length, patched, skipped, unmatched };
  },
});
