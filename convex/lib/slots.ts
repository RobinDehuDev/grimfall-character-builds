export const RUNIC_QUALITIES = ["uncommon", "rare", "epic", "legendary"] as const;
export type RunicQuality = (typeof RUNIC_QUALITIES)[number];

export const SLOT_CATEGORIES = [
  "talent",
  "ability",
  "capstone",
  "uncommon_re",
  "rare_re",
  "epic_re",
  "legendary_re",
] as const;
export type SlotCategory = (typeof SLOT_CATEGORIES)[number];

const SLOT_TO_RE_QUALITY: Record<string, RunicQuality> = {
  uncommon_re: "uncommon",
  rare_re: "rare",
  epic_re: "epic",
  legendary_re: "legendary",
};

export function runicQualityForSlot(category: SlotCategory): RunicQuality | undefined {
  return SLOT_TO_RE_QUALITY[category];
}

export function slotCategoryForAbility(): SlotCategory {
  return "ability";
}

export function slotCategoryForRunicQuality(quality: RunicQuality): SlotCategory {
  const map: Record<RunicQuality, SlotCategory> = {
    uncommon: "uncommon_re",
    rare: "rare_re",
    epic: "epic_re",
    legendary: "legendary_re",
  };
  return map[quality];
}
