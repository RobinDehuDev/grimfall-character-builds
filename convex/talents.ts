import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib/auth";
import { itemMatchesSearch } from "./lib/tags";
import { classNameFromWotlkSlug, filterByWotlkClass } from "./lib/wotlkClass";
import { WOTLK_CLASSES } from "./lib/wotlkClasses";

export const listByWotlkClass = query({
  args: { wotlkClass: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("talents")
      .withIndex("by_wotlk_class", (q) => q.eq("wotlkClass", args.wotlkClass))
      .collect();
  },
});

export const listTalentClasses = query({
  args: {},
  handler: async () => {
    return WOTLK_CLASSES.map((c) => ({
      wotlkClass: c.wotlkClass,
      name: c.name,
      sortOrder: c.sortOrder,
    }));
  },
});

export const list = query({
  args: { wotlkClass: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const talents = await ctx.db.query("talents").collect();
    return filterByWotlkClass(talents, args.wotlkClass);
  },
});

export const searchSpellItems = query({
  args: {
    query: v.string(),
    limit: v.optional(v.number()),
    kinds: v.optional(
      v.array(
        v.union(v.literal("talent"), v.literal("ability"), v.literal("capstone")),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const q = args.query.trim();
    if (q.length < 2) return [];

    const limit = args.limit ?? 50;
    const kinds = args.kinds ?? ["talent", "ability", "capstone"];
    const wantTalent = kinds.includes("talent");
    const wantAbility = kinds.includes("ability");
    const wantCapstone = kinds.includes("capstone");

    const [talents, abilities, capstones] = await Promise.all([
      wantTalent ? ctx.db.query("talents").collect() : Promise.resolve([]),
      wantAbility ? ctx.db.query("abilities").collect() : Promise.resolve([]),
      wantCapstone ? ctx.db.query("capstones").collect() : Promise.resolve([]),
    ]);

    const talentResults = wantTalent
      ? talents
          .filter((item) =>
            itemMatchesSearch(
              { name: item.name, description: item.description, tags: item.tags },
              q,
            ),
          )
          .map((item) => ({
            _id: item._id,
            kind: "talent" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: item.wotlkClass,
            treeName: item.treeName,
            className: classNameFromWotlkSlug(item.wotlkClass),
          }))
      : [];

    const abilityResults = wantAbility
      ? abilities
          .filter((item) =>
            itemMatchesSearch(
              { name: item.name, description: item.description, tags: item.tags },
              q,
            ),
          )
          .map((item) => ({
            _id: item._id,
            kind: "ability" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: item.wotlkClass,
            className: classNameFromWotlkSlug(item.wotlkClass),
            levelRequirement: item.levelRequirement,
            skillLineIds: item.skillLineIds,
          }))
      : [];

    const capstoneResults = wantCapstone
      ? capstones
          .filter((item) =>
            itemMatchesSearch(
              { name: item.name, description: item.description, tags: item.tags },
              q,
            ),
          )
          .map((item) => ({
            _id: item._id,
            kind: "capstone" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: item.wotlkClass,
            className: classNameFromWotlkSlug(item.wotlkClass),
          }))
      : [];

    return [...talentResults, ...abilityResults, ...capstoneResults].slice(0, limit);
  },
});

export const get = query({
  args: { id: v.id("talents") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getMany = query({
  args: { ids: v.array(v.id("talents")) },
  handler: async (ctx, args) => {
    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item) => item !== null);
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    levelRequirement: v.optional(v.number()),
    wotlkClass: v.string(),
    treeIndex: v.number(),
    treeName: v.string(),
    row: v.number(),
    col: v.number(),
    icon: v.string(),
    spellId: v.optional(v.number()),
    externalId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db.insert("talents", {
      ...args,
      levelRequirement: args.levelRequirement ?? 0,
      tags: args.tags ?? [],
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("talents"),
    name: v.string(),
    description: v.string(),
    levelRequirement: v.optional(v.number()),
    wotlkClass: v.string(),
    treeIndex: v.number(),
    treeName: v.string(),
    row: v.number(),
    col: v.number(),
    icon: v.string(),
    spellId: v.optional(v.number()),
    externalId: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      levelRequirement: fields.levelRequirement ?? 0,
      tags: fields.tags ?? [],
    });
  },
});

export const remove = mutation({
  args: { id: v.id("talents") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
