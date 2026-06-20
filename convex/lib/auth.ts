import type { MutationCtx, QueryCtx } from "../_generated/server";
import { hasRole } from "./roles";

type Ctx = QueryCtx | MutationCtx;

export async function getIdentity(ctx: Ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Not authenticated");
  return identity;
}

export async function getCurrentUser(ctx: Ctx) {
  const identity = await getIdentity(ctx);
  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();
  if (!user) throw new Error("User not found");
  return user;
}

export async function requireRole(ctx: Ctx, role: string) {
  const user = await getCurrentUser(ctx);
  if (!hasRole(user.roles, role)) {
    throw new Error(`${role} access required`);
  }
  return user;
}

export async function requireAdmin(ctx: Ctx) {
  return requireRole(ctx, "admin");
}
