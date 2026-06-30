import type { TalentEffect } from "../../convex/lib/talentEffect";
import {
  TALENT_EFFECT_ATTACK_TYPES,
  TALENT_EFFECT_CATEGORIES,
  TALENT_EFFECT_SCHOOLS,
  TYPE_OF_EFFECT,
} from "../../convex/lib/talentEffect";
import taxonomy from "../../data/talent-effect-taxonomy.json";

export type { TalentEffect };
export { TALENT_EFFECT_CATEGORIES, TALENT_EFFECT_ATTACK_TYPES, TALENT_EFFECT_SCHOOLS, TYPE_OF_EFFECT };

export function emptyTalentEffect(): TalentEffect {
  return {
    category: "damage",
    subcategory: "directDamage",
    stat: "damageDone",
    typeOfEffect: "percentage",
    condition: null,
  };
}

export function cloneTalentEffects(effects?: TalentEffect[]): TalentEffect[] {
  return (effects ?? []).map((effect) => ({
    ...effect,
    scope: effect.scope ? { ...effect.scope } : undefined,
    spellNames: effect.spellNames ? [...effect.spellNames] : undefined,
    spellIds: effect.spellIds ? [...effect.spellIds] : undefined,
  }));
}

export function subcategoriesForCategory(categoryId: string): string[] {
  const category = taxonomy.categories.find((c) => c.id === categoryId);
  return category?.subcategories.map((s) => s.id) ?? [];
}

export function categoryLabel(categoryId: string): string {
  const category = taxonomy.categories.find((c) => c.id === categoryId);
  return category?.label ?? categoryId;
}

export function subcategoryLabel(categoryId: string, subcategoryId: string): string {
  const category = taxonomy.categories.find((c) => c.id === categoryId);
  const sub = category?.subcategories.find((s) => s.id === subcategoryId);
  return sub?.label ?? subcategoryId;
}

export function subcategoryOptionsForCategory(
  categoryId: string,
): Array<{ id: string; label: string }> {
  const category = taxonomy.categories.find((c) => c.id === categoryId);
  return (
    category?.subcategories.map((s) => ({ id: s.id, label: s.label })) ?? []
  );
}

export function tabDisplayLabel(tab: {
  category: string;
  subcategory: string;
  school?: string;
}): string {
  const base = `${categoryLabel(tab.category)} › ${subcategoryLabel(tab.category, tab.subcategory)}`;
  if (tab.school) {
    return `${base} › ${schoolLabel(tab.school)}`;
  }
  return base;
}

export function schoolLabel(school: string): string {
  return school.charAt(0).toUpperCase() + school.slice(1);
}

export function statsForSubcategory(categoryId: string, subcategoryId: string): string[] {
  const category = taxonomy.categories.find((c) => c.id === categoryId);
  const sub = category?.subcategories.find((s) => s.id === subcategoryId);
  return sub?.stats ?? [];
}

export function spellNamesToString(spellNames?: string[]): string {
  return spellNames?.join(", ") ?? "";
}

export function spellNamesFromString(value: string): string[] | undefined {
  const names = value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  return names.length > 0 ? names : undefined;
}

export function spellIdsToString(spellIds?: number[]): string {
  return spellIds?.join(", ") ?? "";
}

export function spellIdsFromString(value: string): number[] | undefined {
  const ids = value
    .split(",")
    .map((part) => Number(part.trim()))
    .filter((n) => !Number.isNaN(n) && n > 0);
  return ids.length > 0 ? ids : undefined;
}

function parseOptionalNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const n = Number(trimmed);
  return Number.isNaN(n) ? undefined : n;
}

export function sanitizeTalentEffect(effect: TalentEffect): TalentEffect {
  const out: TalentEffect = {
    category: effect.category.trim(),
    subcategory: effect.subcategory.trim(),
    stat: effect.stat.trim(),
    typeOfEffect: effect.typeOfEffect,
  };

  if (effect.value !== undefined && !Number.isNaN(effect.value)) {
    out.value = effect.value;
  }

  const condition = effect.condition?.trim();
  if (condition) out.condition = condition;
  else if (effect.condition === null) out.condition = null;

  if (effect.duration !== undefined && !Number.isNaN(effect.duration)) {
    out.duration = effect.duration;
  }
  if (effect.recurrence) out.recurrence = true;
  if (
    effect.recurrenceInSeconds !== undefined &&
    !Number.isNaN(effect.recurrenceInSeconds)
  ) {
    out.recurrenceInSeconds = effect.recurrenceInSeconds;
  }

  if (effect.scope?.attackType || effect.scope?.school) {
    out.scope = {
      ...(effect.scope.attackType ? { attackType: effect.scope.attackType } : {}),
      ...(effect.scope.school ? { school: effect.scope.school } : {}),
    };
  }

  if (effect.spellNames?.length) {
    out.spellNames = effect.spellNames.map((name) => name.trim()).filter(Boolean);
  }
  if (effect.spellIds?.length) {
    out.spellIds = effect.spellIds.filter((id) => id > 0);
  }

  return out;
}

export function sanitizeTalentEffects(effects: TalentEffect[]): TalentEffect[] {
  return effects
    .map(sanitizeTalentEffect)
    .filter(
      (effect) =>
        effect.category && effect.subcategory && effect.stat && effect.typeOfEffect,
    );
}

export function parseOptionalNumberField(value: string): number | undefined {
  return parseOptionalNumber(value);
}
