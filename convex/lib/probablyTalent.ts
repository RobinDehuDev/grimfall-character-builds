import talentData from "../seed/data/wotlk-talents.json";
import wotlkAbilityData from "../seed/data/wotlk-abilities.json";

export const PROBABLY_TALENT_SKIP_CLASS = "death-knight";

export type ProbablyTalentAbility = {
  wotlkClass: string;
  name: string;
  externalId?: string;
};

export type ProbablyTalentIndexes = {
  talentNameKeys: Set<string>;
  gridAbilityExternalIds: Set<string>;
};

function classNameKey(wotlkClass: string, name: string) {
  return `${wotlkClass}|${name.toLowerCase()}`;
}

export function buildProbablyTalentIndexes(): ProbablyTalentIndexes {
  const talentNameKeys = new Set<string>();
  for (const talent of talentData.talents) {
    talentNameKeys.add(classNameKey(talent.wotlkClass, talent.name));
  }

  const gridAbilityExternalIds = new Set<string>();
  for (const ability of wotlkAbilityData.abilities) {
    if (ability.treeIndex !== undefined && ability.externalId) {
      gridAbilityExternalIds.add(ability.externalId);
    }
  }

  return { talentNameKeys, gridAbilityExternalIds };
}

export function isProbablyTalent(
  ability: ProbablyTalentAbility,
  indexes: ProbablyTalentIndexes,
): boolean {
  if (ability.wotlkClass === PROBABLY_TALENT_SKIP_CLASS) {
    return false;
  }

  if (indexes.talentNameKeys.has(classNameKey(ability.wotlkClass, ability.name))) {
    return true;
  }

  if (
    ability.externalId &&
    indexes.gridAbilityExternalIds.has(ability.externalId)
  ) {
    return true;
  }

  return false;
}
