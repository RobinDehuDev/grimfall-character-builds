import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { talentGridTypeValidator } from "./lib/talentGridType";
import { RUNIC_QUALITIES } from "./lib/slots";

const runicQualityValidator = v.union(
  ...RUNIC_QUALITIES.map((q) => v.literal(q)),
);

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    roles: v.array(v.string()),
  }).index("by_clerk_id", ["clerkId"]),

  abilities: defineTable({
    name: v.string(),
    description: v.string(),
    wotlkClass: v.string(),
    levelRequirement: v.number(),
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
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
  })
    .index("by_wotlk_class", ["wotlkClass"])
    .index("by_spell_id", ["spellId"]),

  capstones: defineTable({
    name: v.string(),
    description: v.string(),
    wotlkClass: v.string(),
    externalId: v.optional(v.string()),
    icon: v.optional(v.string()),
    tags: v.array(v.string()),
  }).index("by_wotlk_class", ["wotlkClass"]),

  talents: defineTable({
    name: v.string(),
    description: v.string(),
    levelRequirement: v.number(),
    wotlkClass: v.string(),
    treeIndex: v.number(),
    treeName: v.string(),
    row: v.number(),
    col: v.number(),
    icon: v.string(),
    spellId: v.optional(v.number()),
    externalId: v.optional(v.string()),
    tags: v.array(v.string()),
    type: v.optional(talentGridTypeValidator),
  }).index("by_wotlk_class", ["wotlkClass"]),

  runicEnhancements: defineTable({
    quality: runicQualityValidator,
    name: v.string(),
    description: v.string(),
    mainAbility: v.union(v.id("abilities"), v.null()),
    otherAbilities: v.array(v.id("abilities")),
  }).index("by_quality", ["quality"]),

  builds: defineTable({
    userId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    talents: v.array(v.id("talents")),
    abilities: v.array(v.id("abilities")),
    capstone: v.array(v.id("capstones")),
    uncommonRes: v.array(v.id("runicEnhancements")),
    rareRes: v.array(v.id("runicEnhancements")),
    epicRes: v.array(v.id("talents")),
    legendaryRes: v.array(v.id("runicEnhancements")),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_public", ["isPublic"]),

  bugReports: defineTable({
    userId: v.string(),
    relatedItemKind: v.optional(
      v.union(
        v.literal("ability"),
        v.literal("talent"),
        v.literal("capstone"),
        v.literal("runicEnhancement"),
      ),
    ),
    relatedItemId: v.optional(v.string()),
    message: v.string(),
    status: v.union(v.literal("open"), v.literal("resolved")),
    createdAt: v.number(),
  }).index("by_status", ["status"]),
});
