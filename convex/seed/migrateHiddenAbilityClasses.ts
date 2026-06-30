import { internalMutation } from "../_generated/server";
import { hiddenAbilityClassFor } from "../lib/abilityClassification";
import { computeItemTags } from "../lib/tags";
import { WOTLK_CLASS_NAME_BY_SLUG } from "../lib/wotlkClasses";

export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const abilities = await ctx.db.query("abilities").collect();

    let toDnd = 0;
    let toRacials = 0;
    let toProfession = 0;
    let toGeneral = 0;
    let unchanged = 0;

    for (const ability of abilities) {
      const target = hiddenAbilityClassFor(ability);
      if (!target) {
        unchanged += 1;
        continue;
      }
      if (ability.wotlkClass === target) {
        unchanged += 1;
        continue;
      }

      const className = WOTLK_CLASS_NAME_BY_SLUG.get(target);
      await ctx.db.patch(ability._id, {
        wotlkClass: target,
        tags: computeItemTags({
          name: ability.name,
          description: ability.description,
          wotlkClass: target,
          className,
          treeName: ability.treeName,
          kind: "ability",
        }),
      });

      if (target === "dnd") toDnd += 1;
      else if (target === "racials") toRacials += 1;
      else if (target === "profession") toProfession += 1;
      else toGeneral += 1;
    }

    return {
      scanned: abilities.length,
      movedToDnd: toDnd,
      movedToRacials: toRacials,
      movedToProfession: toProfession,
      movedToGeneral: toGeneral,
      unchanged,
    };
  },
});
