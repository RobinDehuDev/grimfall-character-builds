import wotlkAbilityData from "../seed/data/wotlk-abilities.json";

export const CLASS_NAME_TO_SLUG: Record<string, string> = {
  "Death Knight": "death-knight",
  Druid: "druid",
  Hunter: "hunter",
  Mage: "mage",
  Paladin: "paladin",
  Priest: "priest",
  Rogue: "rogue",
  Shaman: "shaman",
  Warlock: "warlock",
  Warrior: "warrior",
};

export const PLAYABLE_CLASS_SLUGS = new Set(Object.values(CLASS_NAME_TO_SLUG));

export const HIDDEN_CLASS_SLUGS = new Set([
  "racials",
  "dnd",
  "unknown",
  "profession",
  "general",
]);

export type AbilityClassSource = {
  wotlkClass: string;
  spellId?: number;
  externalId?: string;
  classField?: string;
};

export type WotlkClassIndexes = {
  bySpellId: Map<number, string>;
  byExternalId: Map<string, string>;
};

export function slugsFromClassField(classField: string | undefined): string[] {
  if (!classField) return [];
  return classField
    .split(",")
    .map((part) => CLASS_NAME_TO_SLUG[part.trim()])
    .filter((slug): slug is string => !!slug);
}

export function buildWotlkClassIndexes(): WotlkClassIndexes {
  const bySpellId = new Map<number, string>();
  const byExternalId = new Map<string, string>();

  for (const ability of wotlkAbilityData.abilities) {
    if (ability.spellId != null) {
      bySpellId.set(ability.spellId, ability.wotlkClass);
    }
    if (ability.externalId) {
      byExternalId.set(ability.externalId, ability.wotlkClass);
    }
  }

  return { bySpellId, byExternalId };
}

export function resolveAbilityWotlkClass(
  ability: AbilityClassSource,
  indexes: WotlkClassIndexes,
): string {
  if (
    HIDDEN_CLASS_SLUGS.has(ability.wotlkClass) &&
    ability.wotlkClass !== "general"
  ) {
    return ability.wotlkClass;
  }

  const fromWotlk =
    (ability.spellId != null ? indexes.bySpellId.get(ability.spellId) : undefined) ??
    (ability.externalId ? indexes.byExternalId.get(ability.externalId) : undefined);
  if (fromWotlk) {
    return fromWotlk;
  }

  const classSlugs = slugsFromClassField(ability.classField);
  if (classSlugs.length === 1) {
    return classSlugs[0]!;
  }

  if (classSlugs.length > 1) {
    return "general";
  }

  return ability.wotlkClass;
}

export function shouldUseGeneralClass(
  wotlkClass: string,
  classField: string | undefined,
  treeIndex: number | undefined,
): boolean {
  if (HIDDEN_CLASS_SLUGS.has(wotlkClass)) return false;
  if (treeIndex != null) return false;
  if (!PLAYABLE_CLASS_SLUGS.has(wotlkClass)) return false;
  return slugsFromClassField(classField).length > 1;
}

export function applyGeneralClassIfNeeded(
  ability: { wotlkClass: string; treeIndex?: number },
  classField?: string,
) {
  if (shouldUseGeneralClass(ability.wotlkClass, classField, ability.treeIndex)) {
    ability.wotlkClass = "general";
  }
}
