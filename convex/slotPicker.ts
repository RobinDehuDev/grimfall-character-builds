import { query } from "./_generated/server";
import { v } from "convex/values";
import { runicQualityForSlot, type SlotCategory } from "./lib/slots";
import { filterByWotlkClass, wotlkClassFromClassId } from "./lib/wotlkClass";

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
    classId: v.optional(v.id("classes")),
    category: slotCategoryValidator,
  },
  handler: async (ctx, args) => {
    const category = args.category as SlotCategory;
    const wotlkClass = await wotlkClassFromClassId(ctx, args.classId);

    if (category === "talent") {
      const talents = await ctx.db.query("talents").collect();
      return filterByWotlkClass(talents, wotlkClass);
    }

    if (category === "ability") {
      const abilities = await ctx.db.query("abilities").collect();
      return filterByWotlkClass(abilities, wotlkClass);
    }

    if (category === "capstone") {
      const capstones = await ctx.db.query("capstones").collect();
      return filterByWotlkClass(capstones, wotlkClass);
    }

    const quality = runicQualityForSlot(category)!;
    return await ctx.db
      .query("runicEnhancements")
      .withIndex("by_quality", (q) => q.eq("quality", quality))
      .collect();
  },
});
