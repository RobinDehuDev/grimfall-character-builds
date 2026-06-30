import { BUILD_SLOTS } from "./buildSlots";
import type { AbilityGameItem } from "./types";
import {
  CLASS_SPEC_NAMES,
  playableSpecColumnOrder,
  primarySkillLineId,
  specIndexForSubclass,
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

function resolveSpecIndexFromSubclass(
  ability: AbilityGameItem,
  wotlkClass: PlayableWotlkClassSlug,
): number | undefined {
  const fromSubclass = specIndexForSubclass(wotlkClass, ability.treeName);
  if (fromSubclass !== undefined) return fromSubclass;

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
  if (a.order !== b.order) {
    return a.order - b.order;
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
  const columnOrder = playableSpecColumnOrder(wotlkClass);
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

  for (const specIndex of columnOrder) {
    ensureGroup(`spec-${specIndex}`, specIndex, specNames[specIndex]);
  }

  for (const ability of abilities) {
    const specIndex = resolveSpecIndexFromSubclass(ability, wotlkClass);

    const group =
      specIndex === undefined
        ? buckets.get("general")!
        : buckets.get(`spec-${specIndex}`)!;
    group.abilities.push(ability);
  }

  const orderedKeys = [
    "general",
    ...columnOrder.map((specIndex) => `spec-${specIndex}`),
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
  treeName?: string,
): string | undefined {
  if (!wotlkClass || !isPlayableWotlkClass(wotlkClass)) return undefined;

  const fromSubclass = specIndexForSubclass(wotlkClass, treeName);
  if (fromSubclass !== undefined) {
    return CLASS_SPEC_NAMES[wotlkClass][fromSubclass];
  }

  const skillLineId = primarySkillLineId(skillLineIds);
  if (skillLineId !== undefined) {
    const fromSkillLine = treeIndexForSkillLine(wotlkClass, skillLineId);
    if (fromSkillLine !== undefined) {
      return CLASS_SPEC_NAMES[wotlkClass][fromSkillLine];
    }
  }

  return "General";
}
