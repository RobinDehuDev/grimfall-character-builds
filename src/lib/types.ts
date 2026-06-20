import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { TalentGridType } from "../../convex/lib/talentGridType";
import {
  slotCategoryForItem,
  type RunicQuality,
  type SlotCategory,
} from "./categories";

interface BaseGameItem {
  id: string;
  name: string;
  description: string;
}

export interface AbilityGameItem extends BaseGameItem {
  type: "ability";
  wotlkClass: string;
  levelRequirement: number;
  externalId?: string;
  icon?: string;
  tags: string[];
  spellId?: number;
  rank?: number;
  isPassive?: boolean;
  castTime?: string;
  cooldown?: string;
  cost?: string;
  range?: string;
  schools?: number;
  skillLineIds?: number[];
}

export interface CapstoneGameItem extends BaseGameItem {
  type: "capstone";
  wotlkClass: string;
  externalId?: string;
  icon?: string;
  tags: string[];
}

export interface TalentGameItem extends BaseGameItem {
  type: "talent";
  gridType?: TalentGridType;
  levelRequirement: number;
  wotlkClass: string;
  treeIndex: number;
  treeName: string;
  row: number;
  col: number;
  icon: string;
  spellId?: number;
  externalId?: string;
  tags: string[];
}

export interface RunicEnhancementGameItem extends BaseGameItem {
  type: "runicEnhancement";
  quality: RunicQuality;
  mainAbility: string | null;
  otherAbilities: string[];
}

export type GameItem =
  | AbilityGameItem
  | CapstoneGameItem
  | TalentGameItem
  | RunicEnhancementGameItem;

export function getItemSlotCategory(item: GameItem): SlotCategory {
  return slotCategoryForItem(item);
}

export function fromConvexAbility(item: Doc<"abilities">): AbilityGameItem {
  return {
    id: item._id,
    type: "ability",
    name: item.name,
    description: item.description,
    wotlkClass: item.wotlkClass,
    levelRequirement: item.levelRequirement,
    externalId: item.externalId,
    icon: item.icon,
    tags: item.tags,
    spellId: item.spellId,
    rank: item.rank,
    isPassive: item.isPassive,
    castTime: item.castTime,
    cooldown: item.cooldown,
    cost: item.cost,
    range: item.range,
    schools: item.schools,
    skillLineIds: item.skillLineIds,
  };
}

export function fromConvexCapstone(item: Doc<"capstones">): CapstoneGameItem {
  return {
    id: item._id,
    type: "capstone",
    name: item.name,
    description: item.description,
    wotlkClass: item.wotlkClass,
    externalId: item.externalId,
    icon: item.icon,
    tags: item.tags,
  };
}

export function fromConvexTalent(item: Doc<"talents">): TalentGameItem {
  return {
    id: item._id,
    type: "talent",
    name: item.name,
    description: item.description,
    levelRequirement: item.levelRequirement,
    wotlkClass: item.wotlkClass,
    treeIndex: item.treeIndex,
    treeName: item.treeName,
    row: item.row,
    col: item.col,
    icon: item.icon,
    spellId: item.spellId,
    externalId: item.externalId,
    tags: item.tags,
    gridType: item.type,
  };
}

export function fromConvexRunicEnhancement(
  item: Doc<"runicEnhancements">,
): RunicEnhancementGameItem {
  return {
    id: item._id,
    type: "runicEnhancement",
    name: item.name,
    description: item.description,
    quality: item.quality,
    mainAbility: item.mainAbility,
    otherAbilities: item.otherAbilities,
  };
}

export function fromSlotPickerRow(
  item: Doc<"talents"> | Doc<"abilities"> | Doc<"capstones"> | Doc<"runicEnhancements">,
  category: SlotCategory,
): GameItem {
  if (category === "talent") return fromConvexTalent(item as Doc<"talents">);
  if (category === "capstone") return fromConvexCapstone(item as Doc<"capstones">);
  if (category.endsWith("_re")) {
    return fromConvexRunicEnhancement(item as Doc<"runicEnhancements">);
  }
  return fromConvexAbility(item as Doc<"abilities">);
}

export function buildItemMap(resolved: {
  talents: Doc<"talents">[];
  abilities: Doc<"abilities">[];
  capstones: Doc<"capstones">[];
  runicEnhancements: Doc<"runicEnhancements">[];
}): Map<string, GameItem> {
  const map = new Map<string, GameItem>();
  for (const item of resolved.talents) map.set(item._id, fromConvexTalent(item));
  for (const item of resolved.abilities) map.set(item._id, fromConvexAbility(item));
  for (const item of resolved.capstones) map.set(item._id, fromConvexCapstone(item));
  for (const item of resolved.runicEnhancements) {
    map.set(item._id, fromConvexRunicEnhancement(item));
  }
  return map;
}

export type CreateItemInput =
  | Omit<AbilityGameItem, "id">
  | Omit<CapstoneGameItem, "id">
  | Omit<TalentGameItem, "id">
  | Omit<RunicEnhancementGameItem, "id">;

export function toCreateAbilityArgs(item: Omit<AbilityGameItem, "id">) {
  return {
    name: item.name,
    description: item.description,
    wotlkClass: item.wotlkClass,
    levelRequirement: item.levelRequirement,
    externalId: item.externalId,
    icon: item.icon,
    tags: item.tags,
    spellId: item.spellId,
    rank: item.rank,
    isPassive: item.isPassive,
    castTime: item.castTime,
    cooldown: item.cooldown,
    cost: item.cost,
    range: item.range,
    schools: item.schools,
    skillLineIds: item.skillLineIds,
  };
}

export function toCreateCapstoneArgs(item: Omit<CapstoneGameItem, "id">) {
  return {
    name: item.name,
    description: item.description,
    wotlkClass: item.wotlkClass,
    externalId: item.externalId,
    icon: item.icon,
    tags: item.tags,
  };
}

export function toCreateTalentArgs(item: Omit<TalentGameItem, "id">) {
  return {
    name: item.name,
    description: item.description,
    levelRequirement: item.levelRequirement,
    wotlkClass: item.wotlkClass,
    treeIndex: item.treeIndex,
    treeName: item.treeName,
    row: item.row,
    col: item.col,
    icon: item.icon,
    spellId: item.spellId,
    externalId: item.externalId,
    tags: item.tags,
    type: item.gridType,
  };
}

export function toCreateRunicEnhancementArgs(item: Omit<RunicEnhancementGameItem, "id">) {
  return {
    quality: item.quality,
    name: item.name,
    description: item.description,
    mainAbility: item.mainAbility as Id<"abilities"> | null,
    otherAbilities: item.otherAbilities as Id<"abilities">[],
  };
}

export function itemHasLevelRequirement(
  item: GameItem,
): item is AbilityGameItem | TalentGameItem {
  return item.type === "ability" || item.type === "talent";
}
