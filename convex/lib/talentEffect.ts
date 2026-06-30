import { v } from "convex/values";

export const TALENT_EFFECT_CATEGORIES = [
  "damage",
  "defense",
  "heal",
  "resource",
  "utility",
  "pet",
] as const;

export const TYPE_OF_EFFECT = [
  "flat",
  "percentage",
  "duration",
  "distance",
  "boolean",
] as const;

export const TALENT_EFFECT_SCHOOLS = [
  "shadow",
  "fire",
  "frost",
  "nature",
  "arcane",
  "holy",
  "physical",
] as const;

export const TALENT_EFFECT_ATTACK_TYPES = [
  "melee",
  "ranged",
  "spell",
] as const;

export const talentEffectScopeValidator = v.object({
  attackType: v.optional(
    v.union(
      v.literal("melee"),
      v.literal("ranged"),
      v.literal("spell"),
    ),
  ),
  school: v.optional(
    v.union(
      v.literal("shadow"),
      v.literal("fire"),
      v.literal("frost"),
      v.literal("nature"),
      v.literal("arcane"),
      v.literal("holy"),
      v.literal("physical"),
    ),
  ),
});

export const talentEffectValidator = v.object({
  category: v.string(),
  subcategory: v.string(),
  stat: v.string(),
  typeOfEffect: v.union(
    v.literal("flat"),
    v.literal("percentage"),
    v.literal("duration"),
    v.literal("distance"),
    v.literal("boolean"),
  ),
  value: v.optional(v.number()),
  condition: v.optional(v.union(v.string(), v.null())),
  duration: v.optional(v.number()),
  recurrence: v.optional(v.boolean()),
  recurrenceInSeconds: v.optional(v.number()),
  scope: v.optional(talentEffectScopeValidator),
  spellNames: v.optional(v.array(v.string())),
  spellIds: v.optional(v.array(v.number())),
});

export type TalentEffectScope = {
  attackType?: (typeof TALENT_EFFECT_ATTACK_TYPES)[number];
  school?: (typeof TALENT_EFFECT_SCHOOLS)[number];
};

export type TalentEffect = {
  category: string;
  subcategory: string;
  stat: string;
  typeOfEffect: (typeof TYPE_OF_EFFECT)[number];
  value?: number;
  condition?: string | null;
  duration?: number;
  recurrence?: boolean;
  recurrenceInSeconds?: number;
  scope?: TalentEffectScope;
  spellNames?: string[];
  spellIds?: number[];
};
