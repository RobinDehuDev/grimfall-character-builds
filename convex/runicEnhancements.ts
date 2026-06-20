import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { requireAdmin } from "./lib/auth";
import { RUNIC_QUALITIES, type RunicQuality } from "./lib/slots";

const runicQualityValidator = v.union(
  ...RUNIC_QUALITIES.map((q) => v.literal(q)),
);

async function assertAbilityReferences(
  ctx: { db: { get: (id: Id<"abilities">) => Promise<Doc<"abilities"> | null> } },
  mainAbility: Id<"abilities"> | null,
  otherAbilities: Id<"abilities">[],
) {
  const ids = [...(mainAbility ? [mainAbility] : []), ...otherAbilities];
  for (const id of ids) {
    const ability = await ctx.db.get(id);
    if (!ability) {
      throw new Error("Runic enhancement abilities must reference ability rows");
    }
  }
}

export const list = query({
  args: { quality: v.optional(runicQualityValidator) },
  handler: async (ctx, args) => {
    if (args.quality) {
      return await ctx.db
        .query("runicEnhancements")
        .withIndex("by_quality", (q) => q.eq("quality", args.quality as RunicQuality))
        .collect();
    }
    return await ctx.db.query("runicEnhancements").collect();
  },
});

export const get = query({
  args: { id: v.id("runicEnhancements") },
  handler: async (ctx, args) => await ctx.db.get(args.id),
});

export const getMany = query({
  args: { ids: v.array(v.id("runicEnhancements")) },
  handler: async (ctx, args) => {
    const items = await Promise.all(args.ids.map((id) => ctx.db.get(id)));
    return items.filter((item) => item !== null);
  },
});

export const create = mutation({
  args: {
    quality: runicQualityValidator,
    name: v.string(),
    description: v.string(),
    mainAbility: v.optional(v.union(v.id("abilities"), v.null())),
    otherAbilities: v.optional(v.array(v.id("abilities"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const mainAbility = args.mainAbility ?? null;
    const otherAbilities = args.otherAbilities ?? [];
    await assertAbilityReferences(ctx, mainAbility, otherAbilities);
    return await ctx.db.insert("runicEnhancements", {
      quality: args.quality,
      name: args.name,
      description: args.description,
      mainAbility,
      otherAbilities,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("runicEnhancements"),
    quality: runicQualityValidator,
    name: v.string(),
    description: v.string(),
    mainAbility: v.optional(v.union(v.id("abilities"), v.null())),
    otherAbilities: v.optional(v.array(v.id("abilities"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { id, ...rest } = args;
    const mainAbility = rest.mainAbility ?? null;
    const otherAbilities = rest.otherAbilities ?? [];
    await assertAbilityReferences(ctx, mainAbility, otherAbilities);
    await ctx.db.patch(id, {
      quality: rest.quality,
      name: rest.name,
      description: rest.description,
      mainAbility,
      otherAbilities,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("runicEnhancements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
