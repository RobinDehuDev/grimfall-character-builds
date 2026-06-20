import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { getIdentity, requireAdmin } from "./lib/auth";

const relatedItemKindValidator = v.union(
  v.literal("ability"),
  v.literal("talent"),
  v.literal("capstone"),
  v.literal("runicEnhancement"),
);

export const create = mutation({
  args: {
    relatedItemKind: v.optional(relatedItemKindValidator),
    relatedItemId: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await getIdentity(ctx);
    return await ctx.db.insert("bugReports", {
      userId: identity.subject,
      relatedItemKind: args.relatedItemKind,
      relatedItemId: args.relatedItemId,
      message: args.message,
      status: "open",
      createdAt: Date.now(),
    });
  },
});

async function resolveItemName(
  ctx: {
    db: {
      get: (
        id:
          | Id<"abilities">
          | Id<"talents">
          | Id<"capstones">
          | Id<"runicEnhancements">,
      ) => Promise<{ name: string } | null>;
    };
  },
  kind: "ability" | "talent" | "capstone" | "runicEnhancement" | undefined,
  id: string | undefined,
) {
  if (!kind || !id) return undefined;
  if (kind === "ability") {
    const item = await ctx.db.get(id as Id<"abilities">);
    return item?.name;
  }
  if (kind === "talent") {
    const item = await ctx.db.get(id as Id<"talents">);
    return item?.name;
  }
  if (kind === "capstone") {
    const item = await ctx.db.get(id as Id<"capstones">);
    return item?.name;
  }
  const item = await ctx.db.get(id as Id<"runicEnhancements">);
  return item?.name;
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const reports = await ctx.db.query("bugReports").order("desc").collect();
    return await Promise.all(
      reports.map(async (report) => {
        const itemName = await resolveItemName(
          ctx,
          report.relatedItemKind,
          report.relatedItemId,
        );
        const user = await ctx.db
          .query("users")
          .filter((q) => q.eq(q.field("clerkId"), report.userId))
          .first();
        return { ...report, itemName, reporterName: user?.name ?? "Unknown" };
      }),
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("bugReports"),
    status: v.union(v.literal("open"), v.literal("resolved")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.id, { status: args.status });
  },
});
