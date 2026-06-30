import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { abilityMetadataArgs } from "./lib/abilityFields";
import { isViewerAdmin, requireAdmin } from "./lib/auth";
import { filterHiddenItems } from "./lib/itemVisibility";
import {
  filterHiddenWotlkClasses,
  normalizeAbilityWotlkClass,
} from "./lib/wotlkClass";
import {
  HIDDEN_WOTLK_CLASSES,
  isHiddenWotlkClass,
  WOTLK_PLAYABLE_CLASSES,
} from "./lib/wotlkClasses";

const includeHiddenItemsArg = { includeHiddenItems: v.optional(v.boolean()) };

async function resolveIncludeHiddenItems(
  ctx: Parameters<typeof isViewerAdmin>[0],
  requested?: boolean,
) {
  const isAdmin = await isViewerAdmin(ctx);
  return isAdmin && (requested ?? false);
}

export const list = query({
  args: includeHiddenItemsArg,
  handler: async (ctx, args) => {
    const includeHiddenClasses = await isViewerAdmin(ctx);
    const includeHiddenItems = await resolveIncludeHiddenItems(
      ctx,
      args.includeHiddenItems,
    );
    const abilities = await ctx.db.query("abilities").collect();
    return filterHiddenItems(
      filterHiddenWotlkClasses(abilities, includeHiddenClasses),
      includeHiddenItems,
    );
  },
});

export const listByWotlkClass = query({
  args: { wotlkClass: v.string(), ...includeHiddenItemsArg },
  handler: async (ctx, args) => {
    const includeHiddenClasses = await isViewerAdmin(ctx);
    const includeHiddenItems = await resolveIncludeHiddenItems(
      ctx,
      args.includeHiddenItems,
    );
    const wotlkClass = normalizeAbilityWotlkClass(args.wotlkClass);
    if (isHiddenWotlkClass(wotlkClass) && !includeHiddenClasses) {
      return [];
    }
    const abilities =
      wotlkClass === "unknown"
        ? (await ctx.db.query("abilities").collect()).filter(
            (ability) =>
              normalizeAbilityWotlkClass(ability.wotlkClass) === "unknown",
          )
        : await ctx.db
            .query("abilities")
            .withIndex("by_wotlk_class", (q) =>
              q.eq("wotlkClass", wotlkClass),
            )
            .collect();
    return filterHiddenItems(abilities, includeHiddenItems);
  },
});

export const listAbilityClasses = query({
  args: {},
  handler: async (ctx) => {
    const includeHidden = await isViewerAdmin(ctx);
    const classes = includeHidden
      ? [...WOTLK_PLAYABLE_CLASSES, ...HIDDEN_WOTLK_CLASSES]
      : WOTLK_PLAYABLE_CLASSES;
    return classes.map((c) => ({
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
    hidden: v.optional(v.boolean()),
    ...abilityMetadataArgs,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { tags, levelRequirement, hidden, addedFromWowhead, probablyTalent, wotlkClass, ...rest } = args;
    return await ctx.db.insert("abilities", {
      ...rest,
      wotlkClass: normalizeAbilityWotlkClass(wotlkClass),
      levelRequirement: levelRequirement ?? 0,
      hidden: hidden ?? false,
      addedFromWowhead: addedFromWowhead ?? false,
      probablyTalent: probablyTalent ?? false,
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
    hidden: v.optional(v.boolean()),
    ...abilityMetadataArgs,
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, tags, levelRequirement, hidden, addedFromWowhead, probablyTalent, wotlkClass, ...rest } = args;
    await ctx.db.patch(id, {
      ...rest,
      wotlkClass: normalizeAbilityWotlkClass(wotlkClass),
      levelRequirement: levelRequirement ?? 0,
      hidden: hidden ?? false,
      addedFromWowhead: addedFromWowhead ?? false,
      probablyTalent: probablyTalent ?? false,
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
