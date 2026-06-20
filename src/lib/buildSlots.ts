import type { ItemCategory } from "./categories";

export const BUILD_SLOTS: Record<ItemCategory, number> = {
  talent: 25,
  ability: 30,
  capstone: 1,
  uncommon_re: 15,
  rare_re: 10,
  epic_re: 5,
  legendary_re: 3,
};

export type BuildSlots = Record<ItemCategory, (string | null)[]>;

export function emptyBuildSlots(): BuildSlots {
  return (Object.keys(BUILD_SLOTS) as ItemCategory[]).reduce((acc, key) => {
    acc[key] = Array(BUILD_SLOTS[key]).fill(null);
    return acc;
  }, {} as BuildSlots);
}
