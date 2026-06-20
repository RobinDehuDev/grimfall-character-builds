import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { BUILD_SLOTS } from "./lib/constants";
import { getIdentity } from "./lib/auth";

const buildSlotsArgs = {
  talents: v.array(v.id("talents")),
  abilities: v.array(v.id("abilities")),
  capstone: v.array(v.id("capstones")),
  uncommonRes: v.array(v.id("runicEnhancements")),
  rareRes: v.array(v.id("runicEnhancements")),
  epicRes: v.array(v.id("runicEnhancements")),
  legendaryRes: v.array(v.id("runicEnhancements")),
};

function validateSlots(slots: {
  talents: string[];
  abilities: string[];
  capstone: string[];
  uncommonRes: string[];
  rareRes: string[];
  epicRes: string[];
  legendaryRes: string[];
}) {
  const checks: [keyof typeof slots, number][] = [
    ["talents", BUILD_SLOTS.talent],
    ["abilities", BUILD_SLOTS.ability],
    ["capstone", BUILD_SLOTS.capstone],
    ["uncommonRes", BUILD_SLOTS.uncommon_re],
    ["rareRes", BUILD_SLOTS.rare_re],
    ["epicRes", BUILD_SLOTS.epic_re],
    ["legendaryRes", BUILD_SLOTS.legendary_re],
  ];
  for (const [key, max] of checks) {
    if (slots[key].length > max) {
      throw new Error(`${key} cannot have more than ${max} items`);
    }
  }
}

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const builds = await ctx.db
      .query("builds")
      .withIndex("by_public", (q) => q.eq("isPublic", true))
      .collect();

    builds.sort((a, b) => b.updatedAt - a.updatedAt);

    return await Promise.all(
      builds.map(async (build) => {
        const gameClass = build.classId ? await ctx.db.get(build.classId) : null;
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), build.userId))
          .first();
        return { ...build, className: gameClass?.name, authorName: user?.name ?? "Unknown" };
      }),
    );
  },
});

export const listMine = query({
  args: {},
  handler: async (ctx) => {
    const identity = await getIdentity(ctx);
    const builds = await ctx.db
      .query("builds")
      .withIndex("by_user", (q) => q.eq("userId", identity.subject))
      .collect();

    builds.sort((a, b) => b.updatedAt - a.updatedAt);

    return await Promise.all(
      builds.map(async (build) => {
        const gameClass = build.classId ? await ctx.db.get(build.classId) : null;
        return { ...build, className: gameClass?.name };
      }),
    );
  },
});

export const get = query({
  args: { id: v.id("builds") },
  handler: async (ctx, args) => {
    const build = await ctx.db.get(args.id);
    if (!build) return null;
    if (!build.isPublic) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity || identity.subject !== build.userId) {
        throw new Error("Build not found");
      }
    }
    const gameClass = build.classId ? await ctx.db.get(build.classId) : null;
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("clerkId"), build.userId))
      .first();
    return {
      ...build,
      className: gameClass?.name,
      authorName: user?.name ?? "Unknown",
    };
  },
});

export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    isPublic: v.boolean(),
    ...buildSlotsArgs,
  },
  handler: async (ctx, args) => {
    const identity = await getIdentity(ctx);
    validateSlots(args);
    return await ctx.db.insert("builds", {
      userId: identity.subject,
      title: args.title,
      description: args.description,
      classId: args.classId,
      isPublic: args.isPublic,
      talents: args.talents,
      abilities: args.abilities,
      capstone: args.capstone,
      uncommonRes: args.uncommonRes,
      rareRes: args.rareRes,
      epicRes: args.epicRes,
      legendaryRes: args.legendaryRes,
      updatedAt: Date.now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("builds"),
    title: v.string(),
    description: v.optional(v.string()),
    classId: v.optional(v.id("classes")),
    isPublic: v.boolean(),
    ...buildSlotsArgs,
  },
  handler: async (ctx, args) => {
    const identity = await getIdentity(ctx);
    const build = await ctx.db.get(args.id);
    if (!build || build.userId !== identity.subject) {
      throw new Error("Not authorized");
    }
    validateSlots(args);
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("builds") },
  handler: async (ctx, args) => {
    const identity = await getIdentity(ctx);
    const build = await ctx.db.get(args.id);
    if (!build || build.userId !== identity.subject) {
      throw new Error("Not authorized");
    }
    await ctx.db.delete(args.id);
  },
});
