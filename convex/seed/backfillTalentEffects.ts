import { internalMutation } from "../_generated/server";
import type { TalentEffect } from "../lib/talentEffect";
import effectData from "./data/talent-effects.json";

type EffectSeedFile = {
  version: number;
  generatedAt: string;
  talentCount: number;
  effectsByExternalId: Record<string, TalentEffect[]>;
};

const seedData = effectData as EffectSeedFile;

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const { effectsByExternalId } = seedData;

    const talents = await ctx.db.query("talents").collect();
    let patched = 0;
    let skipped = 0;
    let unmatched = 0;

    for (const talent of talents) {
      if (!talent.externalId) {
        unmatched += 1;
        continue;
      }
      const effects = effectsByExternalId[talent.externalId];
      if (!effects) {
        unmatched += 1;
        continue;
      }
      const current = JSON.stringify(talent.effects ?? []);
      const incoming = JSON.stringify(effects);
      if (current === incoming) {
        skipped += 1;
        continue;
      }
      await ctx.db.patch(talent._id, { effects });
      patched += 1;
    }

    return {
      total: talents.length,
      patched,
      skipped,
      unmatched,
      seedTalentCount: seedData.talentCount,
    };
  },
});
