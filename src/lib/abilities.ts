import { BUILD_SLOTS } from "./buildSlots";
import type { AbilityGameItem } from "./types";
import {
  CLASS_SPEC_NAMES,
  isWotlkClassSlug,
  primarySkillLineId,
  treeIndexForSkillLine,
} from "./abilitySkillLines";
import type { WotlkClassSlug } from "./talents";
export { talentIconUrl as abilityIconUrl } from "./talents";

export type AbilitySpecGroup = {
  key: string;
  treeIndex: number | null;
  name: string;
  abilities: AbilityGameItem[];
};

export function sortAbilitiesByLevel(
  a: AbilityGameItem,
  b: AbilityGameItem,
): number {
  if (a.levelRequirement !== b.levelRequirement) {
    return a.levelRequirement - b.levelRequirement;
  }
  const nameCmp = a.name.localeCompare(b.name);
  if (nameCmp !== 0) return nameCmp;
  return (a.spellId ?? 0) - (b.spellId ?? 0);
}

export function groupAbilitiesBySpec(
  abilities: AbilityGameItem[],
  wotlkClass: WotlkClassSlug,
): AbilitySpecGroup[] {
  const specNames = CLASS_SPEC_NAMES[wotlkClass];
  const buckets = new Map<string, AbilitySpecGroup>();

  const ensureGroup = (
    key: string,
    treeIndex: number | null,
    name: string,
  ): AbilitySpecGroup => {
    const existing = buckets.get(key);
    if (existing) return existing;
    const group: AbilitySpecGroup = {
      key,
      treeIndex,
      name,
      abilities: [],
    };
    buckets.set(key, group);
    return group;
  };

  ensureGroup("general", null, "General");

  for (let i = 0; i < specNames.length; i += 1) {
    ensureGroup(`spec-${i}`, i, specNames[i]);
  }

  for (const ability of abilities) {
    const skillLineId = primarySkillLineId(ability.skillLineIds);
    const treeIndex =
      skillLineId !== undefined
        ? treeIndexForSkillLine(wotlkClass, skillLineId)
        : undefined;

    const group =
      treeIndex === undefined
        ? buckets.get("general")!
        : buckets.get(`spec-${treeIndex}`)!;
    group.abilities.push(ability);
  }

  const orderedKeys = [
    "general",
    ...specNames.map((_, index) => `spec-${index}`),
  ];

  return orderedKeys
    .map((key) => buckets.get(key)!)
    .filter((group) => group.abilities.length > 0)
    .map((group) => ({
      ...group,
      abilities: [...group.abilities].sort(sortAbilitiesByLevel),
    }));
}

export function slotsToAbilityIdSet(slots: (string | null)[]): Set<string> {
  return new Set(slots.filter((id): id is string => id !== null));
}

export function abilityIdSetToSlots(
  ids: ReadonlySet<string>,
): (string | null)[] {
  const filled = [...ids];
  const slots: (string | null)[] = filled.slice(0, BUILD_SLOTS.ability);
  while (slots.length < BUILD_SLOTS.ability) slots.push(null);
  return slots;
}

export function abilitySpecLabel(
  wotlkClass: string | undefined,
  skillLineIds: number[] | undefined,
): string | undefined {
  if (!wotlkClass || !isWotlkClassSlug(wotlkClass)) return undefined;
  const skillLineId = primarySkillLineId(skillLineIds);
  if (skillLineId === undefined) return "General";
  const treeIndex = treeIndexForSkillLine(wotlkClass, skillLineId);
  if (treeIndex === undefined) return "General";
  return CLASS_SPEC_NAMES[wotlkClass][treeIndex];
}
