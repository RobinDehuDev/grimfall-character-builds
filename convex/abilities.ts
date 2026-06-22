import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { abilityMetadataArgs } from "./lib/abilityFields";
import { requireAdmin } from "./lib/auth";
import { filterByWotlkClass } from "./lib/wotlkClass";
import { WOTLK_CLASSES } from "./lib/wotlkClasses";

export const list = query({
  args: { wotlkClass: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const abilities = await ctx.db.query("abilities").collect();
    return filterByWotlkClass(abilities, args.wotlkClass);
  },
});

export const listByWotlkClass = query({
  args: { wotlkClass: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("abilities")
      .withIndex("by_wotlk_class", (q) => q.eq("wotlkClass", args.wotlkClass))
      .collect();
  },
});

export const listAbilityClasses = query({
  args: {},
  handler: async () => {
    return WOTLK_CLASSES.map((c) => ({
      wotlkClass: c.wotlkClass,
      name: c.name,
      sortOrder: c.sortOrder,
    }));
  },
});

export const get = query({
  args: { id: v.id("abilities") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getMany = query({
  args: { ids: v.array(v.id("abilities")) },
  handler: async (ctx, args) => {
    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item) => item !== null);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    wotlkClass: v.string(),
    levelRequirement: v.optional(v.number()),
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    ...abilityMetadataArgs,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { tags, levelRequirement, ...rest } = args;
    return await ctx.db.insert("abilities", {
      ...rest,
      levelRequirement: levelRequirement ?? 0,
      tags: tags ?? [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("abilities"),
    name: v.string(),
    description: v.string(),
    wotlkClass: v.string(),
    levelRequirement: v.optional(v.number()),
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    ...abilityMetadataArgs,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, tags, levelRequirement, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      levelRequirement: levelRequirement ?? 0,
      tags: tags ?? [],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("abilities") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
