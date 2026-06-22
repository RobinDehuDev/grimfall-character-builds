import { v } from "convex/values";

export type TalentGridType = "talent" | "ability";

export const talentGridTypeValidator = v.union(
  v.literal("talent"),
  v.literal("ability"),
);
