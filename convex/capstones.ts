import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { filterByWotlkClass } from "./lib/wotlkClass";

export const list = query({
  args: { wotlkClass: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const capstones = await ctx.db.query("capstones").collect();
    return filterByWotlkClass(capstones, args.wotlkClass);
  },
});

export const get = query({
  args: { id: v.id("capstones") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getMany = query({
  args: { ids: v.array(v.id("capstones")) },
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
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("capstones", {
      name: args.name,
      description: args.description,
      wotlkClass: args.wotlkClass,
      externalId: args.externalId,
      icon: args.icon,
      tags: args.tags ?? [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("capstones"),
    name: v.string(),
    description: v.string(),
    wotlkClass: v.string(),
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      tags: fields.tags ?? [],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("capstones") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
