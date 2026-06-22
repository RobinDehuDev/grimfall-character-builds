import { v } from "convex/values";

export const abilityMetadataArgs = {
  spellId: v.optional(v.number()),
  rank: v.optional(v.number()),
  isPassive: v.optional(v.boolean()),
  castTime: v.optional(v.string()),
  cooldown: v.optional(v.string()),
  cost: v.optional(v.string()),
  range: v.optional(v.string()),
  schools: v.optional(v.number()),
  skillLineIds: v.optional(v.array(v.number())),
  treeIndex: v.optional(v.number()),
  treeName: v.optional(v.string()),
  row: v.optional(v.number()),
  col: v.optional(v.number()),
};
