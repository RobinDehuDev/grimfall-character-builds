export type ItemType = "ability" | "capstone" | "talent" | "runicEnhancement";

export type RunicQuality = "uncommon" | "rare" | "epic" | "legendary";

/** Build slot categories — how items are grouped in a build */
export type SlotCategory =
  | "talent"
  | "ability"
  | "capstone"
  | "uncommon_re"
  | "rare_re"
  | "epic_re"
  | "legendary_re";

/** @deprecated Use SlotCategory for build slots */
export type ItemCategory = SlotCategory;

export interface CategoryMeta {
  key: SlotCategory;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "ability", color: "var(--quality-rare)" },
  { key: "talent", color: "var(--quality-uncommon)" },
  { key: "capstone", color: "var(--quality-legendary)" },
  { key: "legendary_re", color: "var(--quality-legendary)" },
  { key: "epic_re", color: "var(--quality-epic)" },
  { key: "rare_re", color: "var(--quality-rare)" },
  { key: "uncommon_re", color: "var(--quality-uncommon)" },
];

export const RUNIC_QUALITIES: RunicQuality[] = [
  "uncommon",
  "rare",
  "epic",
  "legendary",
];

export const ITEM_TYPES: ItemType[] = ["ability", "capstone", "talent", "runicEnhancement"];

const QUALITY_TO_SLOT: Record<RunicQuality, SlotCategory> = {
  uncommon: "uncommon_re",
  rare: "rare_re",
  epic: "epic_re",
  legendary: "legendary_re",
};

export function getCategoryMeta(key: SlotCategory): CategoryMeta {
  return CATEGORIES.find((c) => c.key === key)!;
}

export const RUNIC_CATEGORIES = CATEGORIES.filter(
  (c) => c.key.endsWith("_re") && c.key !== "epic_re",
);

export function slotCategoryForItem(item: {
  type: ItemType;
  quality?: RunicQuality;
}): SlotCategory {
  if (item.type === "talent") return "talent";
  if (item.type === "ability") return "ability";
  if (item.type === "capstone") return "capstone";
  return QUALITY_TO_SLOT[item.quality!];
}

export function qualityColorClass(quality: RunicQuality): string {
  const map: Record<RunicQuality, string> = {
    uncommon: "text-quality-uncommon",
    rare: "text-quality-rare",
    epic: "text-quality-epic",
    legendary: "text-quality-legendary",
  };
  return map[quality];
}

export function slotCategoryColorClass(category: SlotCategory): string {
  const map: Record<SlotCategory, string> = {
    talent: "text-quality-uncommon",
    ability: "text-quality-rare",
    capstone: "text-quality-legendary",
    uncommon_re: "text-quality-uncommon",
    rare_re: "text-quality-rare",
    epic_re: "text-quality-epic",
    legendary_re: "text-quality-legendary",
  };
  return map[category];
}
