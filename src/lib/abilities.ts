import { BUILD_SLOTS } from "./buildSlots";
import type { AbilityGameItem } from "./types";
import {
  CLASS_SPEC_NAMES,
  primarySkillLineId,
  treeIndexForSkillLine,
} from "./abilitySkillLines";
import {
  isHiddenWotlkClass,
  isPlayableWotlkClass,
  type PlayableWotlkClassSlug,
  displayWotlkClassName,
} from "./wotlkClasses";
export { talentIconUrl as abilityIconUrl } from "./talents";

export type AbilitySpecGroup = {
  key: string;
  treeIndex: number | null;
  name: string;
  abilities: AbilityGameItem[];
};

function resolvePlayableTreeIndex(
  ability: AbilityGameItem,
  wotlkClass: PlayableWotlkClassSlug,
): number | undefined {
  if (ability.treeIndex !== undefined) return ability.treeIndex;
  const skillLineId = primarySkillLineId(ability.skillLineIds);
  return skillLineId !== undefined
    ? treeIndexForSkillLine(wotlkClass, skillLineId)
    : undefined;
}

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
  wotlkClass: PlayableWotlkClassSlug,
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
    const treeIndex = resolvePlayableTreeIndex(ability, wotlkClass);

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

export function groupAbilitiesByTreeName(
  abilities: AbilityGameItem[],
): AbilitySpecGroup[] {
  const buckets = new Map<string, AbilityGameItem[]>();
  for (const ability of abilities) {
    const name = ability.treeName?.trim() || "Other";
    const list = buckets.get(name) ?? [];
    list.push(ability);
    buckets.set(name, list);
  }
  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, groupAbilities], index) => ({
      key: `tree-${index}`,
      treeIndex: index,
      name,
      abilities: [...groupAbilities].sort(sortAbilitiesByLevel),
    }));
}

function groupHiddenAbilities(
  abilities: AbilityGameItem[],
  wotlkClass: string,
): AbilitySpecGroup[] {
  if (wotlkClass === "racials" || wotlkClass === "profession" || wotlkClass === "general") {
    return groupAbilitiesByTreeName(abilities);
  }
  const label =
    wotlkClass === "dnd"
      ? "DND"
      : displayWotlkClassName(wotlkClass);
  return [
    {
      key: "general",
      treeIndex: null,
      name: label,
      abilities: [...abilities].sort(sortAbilitiesByLevel),
    },
  ];
}

export function groupAbilitiesForClass(
  abilities: AbilityGameItem[],
  wotlkClass: string,
): AbilitySpecGroup[] {
  if (isPlayableWotlkClass(wotlkClass)) {
    return groupAbilitiesBySpec(abilities, wotlkClass);
  }
  if (isHiddenWotlkClass(wotlkClass)) {
    return groupHiddenAbilities(abilities, wotlkClass);
  }
  return groupHiddenAbilities(abilities, "unknown");
}

export function abilitySpecLabel(
  wotlkClass: string | undefined,
  skillLineIds: number[] | undefined,
  treeIndex?: number,
): string | undefined {
  if (!wotlkClass || !isPlayableWotlkClass(wotlkClass)) return undefined;
  let resolvedTreeIndex = treeIndex;
  if (resolvedTreeIndex === undefined) {
    const skillLineId = primarySkillLineId(skillLineIds);
    if (skillLineId !== undefined) {
      resolvedTreeIndex = treeIndexForSkillLine(wotlkClass, skillLineId);
    }
  }
  if (resolvedTreeIndex === undefined) return "General";
  return CLASS_SPEC_NAMES[wotlkClass][resolvedTreeIndex];
}
