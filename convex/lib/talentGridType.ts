import { v } from "convex/values";

export const TALENT_GRID_TYPES = ["talent", "ability"] as const;
export type TalentGridType = (typeof TALENT_GRID_TYPES)[number];

export const talentGridTypeValidator = v.union(
  v.literal("talent"),
  v.literal("ability"),
);
