import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin, isViewerAdmin } from "./lib/auth";
import { filterHiddenItems } from "./lib/itemVisibility";
import { itemMatchesSearch } from "./lib/tags";
import {
  classNameFromWotlkSlug,
  filterByWotlkClass,
  filterHiddenWotlkClasses,
  normalizeAbilityWotlkClass,
} from "./lib/wotlkClass";
import { WOTLK_PLAYABLE_CLASSES } from "./lib/wotlkClasses";

function spellItemSearchFields(item: {
  name: string;
  description: string;
  tags: string[];
  wotlkClass: string;
}) {
  const wotlkClass = normalizeAbilityWotlkClass(item.wotlkClass);
  const className = classNameFromWotlkSlug(wotlkClass);
  return {
    name: item.name,
    description: item.description,
    tags: [
      ...item.tags,
      wotlkClass,
      wotlkClass.replace(/-/g, " "),
      ...(className ? [className] : []),
    ],
  };
}

const includeHiddenItemsArg = { includeHiddenItems: v.optional(v.boolean()) };

async function resolveIncludeHiddenItems(
  ctx: Parameters<typeof isViewerAdmin>[0],
  requested?: boolean,
) {
  const isAdmin = await isViewerAdmin(ctx);
  return isAdmin && (requested ?? false);
}

export const listByWotlkClass = query({
  args: { wotlkClass: v.string(), ...includeHiddenItemsArg },
  handler: async (ctx, args) => {
    const includeHiddenItems = await resolveIncludeHiddenItems(
      ctx,
      args.includeHiddenItems,
    );
    const wotlkClass = normalizeAbilityWotlkClass(args.wotlkClass);
    const talents = await ctx.db
      .query("talents")
      .withIndex("by_wotlk_class", (q) => q.eq("wotlkClass", wotlkClass))
      .collect();
    return filterHiddenItems(talents, includeHiddenItems);
  },
});

export const listTalentClasses = query({
  args: {},
  handler: async () => {
    return WOTLK_PLAYABLE_CLASSES.map((c) => ({
      wotlkClass: c.wotlkClass,
      name: c.name,
      sortOrder: c.sortOrder,
    }));
  },
});

export const list = query({
  args: { wotlkClass: v.optional(v.string()), ...includeHiddenItemsArg },
  handler: async (ctx, args) => {
    const includeHiddenItems = await resolveIncludeHiddenItems(
      ctx,
      args.includeHiddenItems,
    );
    const talents = await ctx.db.query("talents").collect();
    return filterHiddenItems(
      filterByWotlkClass(talents, args.wotlkClass),
      includeHiddenItems,
    );
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
    ...includeHiddenItemsArg,
  },
  handler: async (ctx, args) => {
    const q = args.query.trim();
    if (q.length < 2) return [];

    const limit = args.limit ?? 50;
    const kinds = args.kinds ?? ["talent", "ability", "capstone"];
    const wantTalent = kinds.includes("talent");
    const wantAbility = kinds.includes("ability");
    const wantCapstone = kinds.includes("capstone");
    const includeHiddenClasses = await isViewerAdmin(ctx);
    const includeHiddenItems = await resolveIncludeHiddenItems(
      ctx,
      args.includeHiddenItems,
    );

    const [talents, abilities, capstones] = await Promise.all([
      wantTalent ? ctx.db.query("talents").collect() : Promise.resolve([]),
      wantAbility ? ctx.db.query("abilities").collect() : Promise.resolve([]),
      wantCapstone ? ctx.db.query("capstones").collect() : Promise.resolve([]),
    ]);

    const talentResults = wantTalent
      ? filterHiddenItems(talents, includeHiddenItems)
          .filter((item) =>
            itemMatchesSearch(spellItemSearchFields(item), q),
          )
          .map((item) => ({
            _id: item._id,
            kind: "talent" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: normalizeAbilityWotlkClass(item.wotlkClass),
            treeName: item.treeName,
            className: classNameFromWotlkSlug(item.wotlkClass),
          }))
      : [];

    const abilityResults = wantAbility
      ? filterHiddenItems(
          filterHiddenWotlkClasses(abilities, includeHiddenClasses),
          includeHiddenItems,
        )
          .filter((item) =>
            itemMatchesSearch(spellItemSearchFields(item), q),
          )
          .map((item) => ({
            _id: item._id,
            kind: "ability" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: normalizeAbilityWotlkClass(item.wotlkClass),
            className: classNameFromWotlkSlug(item.wotlkClass),
            levelRequirement: item.levelRequirement,
            skillLineIds: item.skillLineIds,
          }))
      : [];

    const capstoneResults = wantCapstone
      ? filterHiddenItems(capstones, includeHiddenItems)
          .filter((item) =>
            itemMatchesSearch(spellItemSearchFields(item), q),
          )
          .map((item) => ({
            _id: item._id,
            kind: "capstone" as const,
            name: item.name,
            description: item.description,
            tags: item.tags,
            wotlkClass: normalizeAbilityWotlkClass(item.wotlkClass),
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
    hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { hidden, ...rest } = args;
    return await ctx.db.insert("talents", {
      ...rest,
      levelRequirement: args.levelRequirement ?? 0,
      hidden: hidden ?? false,
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
    hidden: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, hidden, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      levelRequirement: fields.levelRequirement ?? 0,
      hidden: hidden ?? false,
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
