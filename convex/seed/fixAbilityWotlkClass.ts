import { internalMutation } from "../_generated/server";
import {
  buildWotlkClassIndexes,
  resolveAbilityWotlkClass,
} from "../lib/resolveAbilityWotlkClass";
import grimfallData from "./data/grimfall-abilities.json";

type GrimfallRow = (typeof grimfallData.abilities)[number];

const grimfallClassBySpellId = new Map<number, string>();
const grimfallClassByExternalId = new Map<string, string>();

for (const row of grimfallData.abilities as GrimfallRow[]) {
  if (row.spellId != null) {
    grimfallClassBySpellId.set(row.spellId, row.wotlkClass);
  }
  if (row.externalId) {
    grimfallClassByExternalId.set(row.externalId, row.wotlkClass);
  }
}

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const indexes = buildWotlkClassIndexes();
    const abilities = await ctx.db.query("abilities").collect();

    let updated = 0;
    const byFromTo: Record<string, number> = {};

    for (const ability of abilities) {
      const fromSeed =
        (ability.spellId != null
          ? grimfallClassBySpellId.get(ability.spellId)
          : undefined) ??
        (ability.externalId
          ? grimfallClassByExternalId.get(ability.externalId)
          : undefined);

      const resolved =
        fromSeed ??
        resolveAbilityWotlkClass(
          {
            wotlkClass: ability.wotlkClass,
            spellId: ability.spellId,
            externalId: ability.externalId,
          },
          indexes,
        );

      if (resolved === ability.wotlkClass) continue;

      const key = `${ability.wotlkClass} -> ${resolved}`;
      byFromTo[key] = (byFromTo[key] ?? 0) + 1;
      await ctx.db.patch(ability._id, { wotlkClass: resolved });
      updated += 1;
    }

    return { updated, byFromTo };
  },
});
