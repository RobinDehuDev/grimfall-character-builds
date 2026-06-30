/** Classify abilities into admin-only hidden buckets. */

const DND_PATTERN = /[\({]DND[\)}]/i;

export function isDndLabel(value: string | undefined): boolean {
  return DND_PATTERN.test(value ?? "");
}

export function isDndAbility(ability: {
  name: string;
  treeName?: string;
}): boolean {
  return isDndLabel(ability.name) || isDndLabel(ability.treeName);
}

export function isRacialAbilityTreeName(treeName: string | undefined): boolean {
  return /racial/i.test(treeName ?? "");
}

export function isProfessionAbilityTreeName(treeName: string | undefined): boolean {
  return /^engineering$/i.test(treeName?.trim() ?? "");
}

import { isPlayableWotlkClass } from "./wotlkClasses";

export type HiddenAbilityClass = "dnd" | "racials" | "profession" | "general";

/** DND → racial → profession → general (no spec treeIndex). */
export function hiddenAbilityClassFor(ability: {
  name: string;
  treeName?: string;
  treeIndex?: number;
  wotlkClass?: string;
}): HiddenAbilityClass | null {
  if (isDndAbility(ability)) return "dnd";
  if (isRacialAbilityTreeName(ability.treeName)) return "racials";
  if (isProfessionAbilityTreeName(ability.treeName)) return "profession";
  if (
    ability.treeIndex === undefined &&
    ability.wotlkClass &&
    isPlayableWotlkClass(ability.wotlkClass)
  ) {
    return "general";
  }
  return null;
}
