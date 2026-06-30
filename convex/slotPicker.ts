import { query } from "./_generated/server";
import { v } from "convex/values";
import { runicQualityForSlot, type SlotCategory } from "./lib/slots";
import { filterByWotlkClass, filterHiddenWotlkClasses } from "./lib/wotlkClass";
import { filterHiddenItems } from "./lib/itemVisibility";
import { isViewerAdmin } from "./lib/auth";

const slotCategoryValidator = v.union(
  v.literal("talent"),
  v.literal("ability"),
  v.literal("capstone"),
  v.literal("uncommon_re"),
  v.literal("rare_re"),
  v.literal("epic_re"),
  v.literal("legendary_re"),
);

export const listByClassAndCategory = query({
  args: {
    wotlkClass: v.optional(v.string()),
    category: slotCategoryValidator,
  },
  handler: async (ctx, args) => {
    const category = args.category as SlotCategory;
    const wotlkClass = args.wotlkClass;
    const includeHidden = await isViewerAdmin(ctx);

    if (category === "talent" || category === "epic_re") {
      const talents = await ctx.db.query("talents").collect();
      return filterHiddenItems(
        filterByWotlkClass(talents, wotlkClass),
        false,
      );
    }

    if (category === "ability") {
      const abilities = await ctx.db.query("abilities").collect();
      return filterHiddenItems(
        filterHiddenWotlkClasses(
          filterByWotlkClass(abilities, wotlkClass),
          includeHidden,
        ),
        false,
      );
    }

    if (category === "capstone") {
      const capstones = await ctx.db.query("capstones").collect();
      return filterHiddenItems(
        filterByWotlkClass(capstones, wotlkClass),
        false,
      );
    }

    const quality = runicQualityForSlot(category)!;
    const runicEnhancements = await ctx.db
      .query("runicEnhancements")
      .withIndex("by_quality", (q) => q.eq("quality", quality))
      .collect();
    return filterHiddenItems(runicEnhancements, false);
  },
});
