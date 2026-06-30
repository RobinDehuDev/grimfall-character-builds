import type { Id } from "../../convex/_generated/dataModel";
import type { RunicQuality } from "./categories";
import type {
  AbilityGameItem,
  CapstoneGameItem,
  RunicEnhancementGameItem,
  TalentGameItem,
} from "./types";
import { normalizeAbilityWotlkClass } from "./wotlkClasses";

export type AbilityFormState = {
  name: string;
  description: string;
  wotlkClass: string;
  levelRequirement: number;
  order: number;
  externalId: string;
  icon: string;
  spellId: string;
  rank: string;
  isPassive: boolean;
  castTime: string;
  cooldown: string;
  cost: string;
  range: string;
  schools: string;
  skillLineIds: string;
  treeIndex: string;
  treeName: string;
  row: string;
  col: string;
  hidden: boolean;
  addedFromWowhead: boolean;
  probablyTalent: boolean;
};

export type TalentFormState = {
  name: string;
  description: string;
  levelRequirement: number;
  wotlkClass: string;
  treeIndex: number;
  treeName: string;
  row: number;
  col: number;
  icon: string;
  spellId: string;
  externalId: string;
  hidden: boolean;
};

export type REFormState = {
  quality: RunicQuality;
  name: string;
  description: string;
  mainAbility: Id<"abilities"> | "";
  otherAbilities: Id<"abilities">[];
  hidden: boolean;
};

export type CapstoneFormState = {
  name: string;
  description: string;
  wotlkClass: string;
  externalId: string;
  icon: string;
  hidden: boolean;
};

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

function parseSkillLineIds(value: string): number[] | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const ids = trimmed
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => !Number.isNaN(n));
  return ids.length > 0 ? ids : undefined;
}

export function emptyAbilityForm(wotlkClass = "mage"): AbilityFormState {
  return {
    name: "",
    description: "",
    wotlkClass,
    levelRequirement: 0,
    order: 0,
    externalId: "",
    icon: "",
    spellId: "",
    rank: "",
    isPassive: false,
    castTime: "",
    cooldown: "",
    cost: "",
    range: "",
    schools: "",
    skillLineIds: "",
    treeIndex: "",
    treeName: "",
    row: "",
    col: "",
    hidden: false,
    addedFromWowhead: false,
    probablyTalent: false,
  };
}

export function abilityToForm(
  item: AbilityGameItem,
  fallbackClass?: string,
): AbilityFormState {
  const slug = normalizeAbilityWotlkClass(item.wotlkClass);
  const wotlkClass =
    slug === "unknown" && fallbackClass
      ? normalizeAbilityWotlkClass(fallbackClass)
      : slug;

  return {
    name: item.name,
    description: item.description,
    wotlkClass,
    levelRequirement: item.levelRequirement,
    order: item.order,
    externalId: item.externalId ?? "",
    icon: item.icon ?? "",
    spellId: item.spellId?.toString() ?? "",
    rank: item.rank?.toString() ?? "",
    isPassive: item.isPassive ?? false,
    castTime: item.castTime ?? "",
    cooldown: item.cooldown ?? "",
    cost: item.cost ?? "",
    range: item.range ?? "",
    schools: item.schools?.toString() ?? "",
    skillLineIds: item.skillLineIds?.join(", ") ?? "",
    treeIndex: item.treeIndex?.toString() ?? "",
    treeName: item.treeName ?? "",
    row: item.row?.toString() ?? "",
    col: item.col?.toString() ?? "",
    hidden: item.hidden ?? false,
    addedFromWowhead: item.addedFromWowhead ?? false,
    probablyTalent: item.probablyTalent ?? false,
  };
}

export function formToAbilityArgs(form: AbilityFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    wotlkClass: normalizeAbilityWotlkClass(form.wotlkClass),
    levelRequirement: form.levelRequirement,
    order: form.order,
    externalId: form.externalId.trim() || undefined,
    icon: form.icon.trim() || undefined,
    spellId: parseOptionalNumber(form.spellId),
    rank: parseOptionalNumber(form.rank),
    isPassive: form.isPassive || undefined,
    castTime: form.castTime.trim() || undefined,
    cooldown: form.cooldown.trim() || undefined,
    cost: form.cost.trim() || undefined,
    range: form.range.trim() || undefined,
    schools: parseOptionalNumber(form.schools),
    skillLineIds: parseSkillLineIds(form.skillLineIds),
    treeIndex: parseOptionalNumber(form.treeIndex),
    treeName: form.treeName.trim() || undefined,
    row: parseOptionalNumber(form.row),
    col: parseOptionalNumber(form.col),
    hidden: form.hidden,
    addedFromWowhead: form.addedFromWowhead,
    probablyTalent: form.probablyTalent,
    tags: [] as string[],
  };
}

export function emptyTalentForm(wotlkClass = "mage"): TalentFormState {
  return {
    name: "",
    description: "",
    levelRequirement: 0,
    wotlkClass,
    treeIndex: 0,
    treeName: "",
    row: 1,
    col: 1,
    icon: "",
    spellId: "",
    externalId: "",
    hidden: false,
  };
}

export function talentToForm(item: TalentGameItem): TalentFormState {
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
    spellId: item.spellId?.toString() ?? "",
    externalId: item.externalId ?? "",
    hidden: item.hidden ?? false,
  };
}

export function formToTalentArgs(form: TalentFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    levelRequirement: form.levelRequirement,
    wotlkClass: form.wotlkClass.trim(),
    treeIndex: form.treeIndex,
    treeName: form.treeName.trim(),
    row: form.row,
    col: form.col,
    icon: form.icon.trim(),
    spellId: parseOptionalNumber(form.spellId),
    externalId: form.externalId.trim() || undefined,
    hidden: form.hidden,
    tags: [] as string[],
  };
}

export function emptyREForm(quality: RunicQuality = "uncommon"): REFormState {
  return {
    quality,
    name: "",
    description: "",
    mainAbility: "",
    otherAbilities: [],
    hidden: false,
  };
}

export function reToForm(item: RunicEnhancementGameItem): REFormState {
  return {
    quality: item.quality,
    name: item.name,
    description: item.description,
    mainAbility: (item.mainAbility ?? "") as Id<"abilities"> | "",
    otherAbilities: item.otherAbilities as Id<"abilities">[],
    hidden: item.hidden ?? false,
  };
}

export function formToREArgs(form: REFormState) {
  return {
    quality: form.quality,
    name: form.name.trim(),
    description: form.description.trim(),
    mainAbility: form.mainAbility ? form.mainAbility : null,
    otherAbilities: form.otherAbilities,
    hidden: form.hidden,
  };
}

export function emptyCapstoneForm(wotlkClass = "mage"): CapstoneFormState {
  return {
    name: "",
    description: "",
    wotlkClass,
    externalId: "",
    icon: "",
    hidden: false,
  };
}

export function capstoneToForm(item: CapstoneGameItem): CapstoneFormState {
  return {
    name: item.name,
    description: item.description,
    wotlkClass: item.wotlkClass,
    externalId: item.externalId ?? "",
    icon: item.icon ?? "",
    hidden: item.hidden ?? false,
  };
}

export function formToCapstoneArgs(form: CapstoneFormState) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    wotlkClass: form.wotlkClass.trim(),
    externalId: form.externalId.trim() || undefined,
    icon: form.icon.trim() || undefined,
    hidden: form.hidden,
    tags: [] as string[],
  };
}
