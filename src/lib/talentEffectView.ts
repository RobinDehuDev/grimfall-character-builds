import type { TalentEffect } from "../../convex/lib/talentEffect";
import type { TalentGameItem } from "./types";

export type EffectViewTab = {
  category: string;
  subcategory: string;
  school?: string;
};

/** Subcategories that require a school when opening a tab. */
export const SCHOOL_SCOPED_SUBCATEGORIES = new Set(["schoolDamage"]);

export type EffectColumn = "flat" | "percent" | "conditional";

export type TalentEffectRow = {
  talent: TalentGameItem;
  effect: TalentEffect;
};

export const EFFECT_COLUMNS: EffectColumn[] = ["flat", "percent", "conditional"];

export const ADMIN_TALENT_EFFECT_TABS_KEY = "admin-talent-effect-tabs";
export const TALENT_EFFECT_TABS_KEY = "talent-effect-tabs";

export function tabKey(tab: EffectViewTab): string {
  if (tab.school) return `${tab.category}:${tab.subcategory}:${tab.school}`;
  return `${tab.category}:${tab.subcategory}`;
}

export function parseTabKey(key: string): EffectViewTab | null {
  const parts = key.split(":");
  if (parts.length === 2) {
    return { category: parts[0], subcategory: parts[1] };
  }
  if (parts.length === 3) {
    return { category: parts[0], subcategory: parts[1], school: parts[2] };
  }
  return null;
}

export function effectMatchesSchool(
  effect: TalentEffect,
  school: string,
): boolean {
  if (effect.scope?.school === school) return true;
  if (effect.stat === `schoolDamage_${school}`) return true;
  return false;
}

export function effectMatchesTab(effect: TalentEffect, tab: EffectViewTab): boolean {
  if (effect.category !== tab.category || effect.subcategory !== tab.subcategory) {
    return false;
  }
  if (tab.school) {
    return effectMatchesSchool(effect, tab.school);
  }
  if (SCHOOL_SCOPED_SUBCATEGORIES.has(tab.subcategory)) {
    return false;
  }
  return true;
}

export function effectColumn(effect: TalentEffect): EffectColumn | null {
  if (effect.condition?.trim()) return "conditional";
  if (effect.typeOfEffect === "percentage") return "percent";
  if (
    effect.typeOfEffect === "flat" ||
    effect.typeOfEffect === "duration" ||
    effect.typeOfEffect === "distance"
  ) {
    return "flat";
  }
  return null;
}

export function sortValue(effect: TalentEffect): number {
  if (effect.value === undefined || Number.isNaN(effect.value)) return 0;
  return Math.abs(effect.value);
}

export function matchingEffects(
  talent: TalentGameItem,
  tab: EffectViewTab,
): TalentEffect[] {
  return (talent.effects ?? []).filter((effect) => effectMatchesTab(effect, tab));
}

export function bestMatchingEffect(
  talent: TalentGameItem,
  tab: EffectViewTab,
): TalentEffect | undefined {
  const matches = matchingEffects(talent, tab);
  if (matches.length === 0) return undefined;
  return matches.reduce((best, current) =>
    sortValue(current) > sortValue(best) ? current : best,
  );
}

export function formatEffectValue(effect: TalentEffect): string {
  if (effect.value === undefined) return "—";
  const sign = effect.value > 0 ? "+" : "";
  if (effect.typeOfEffect === "percentage") {
    return `${sign}${effect.value}%`;
  }
  if (effect.typeOfEffect === "duration") {
    return `${sign}${effect.value}s`;
  }
  if (effect.typeOfEffect === "distance") {
    return `${sign}${effect.value} yd`;
  }
  return `${sign}${effect.value}`;
}

export function groupTalentsForTab(
  talents: TalentGameItem[],
  tab: EffectViewTab,
  invert: boolean,
): Record<EffectColumn, TalentEffectRow[]> {
  const buckets: Record<EffectColumn, TalentEffectRow[]> = {
    flat: [],
    percent: [],
    conditional: [],
  };

  for (const talent of talents) {
    const matches = matchingEffects(talent, tab);
    const byColumn = new Map<EffectColumn, TalentEffect>();

    for (const effect of matches) {
      const column = effectColumn(effect);
      if (!column) continue;
      const existing = byColumn.get(column);
      if (!existing || sortValue(effect) > sortValue(existing)) {
        byColumn.set(column, effect);
      }
    }

    for (const [column, effect] of byColumn) {
      buckets[column].push({ talent, effect });
    }
  }

  for (const column of EFFECT_COLUMNS) {
    buckets[column].sort((a, b) => {
      const diff = sortValue(b.effect) - sortValue(a.effect);
      if (diff !== 0) return invert ? -diff : diff;
      return a.talent.name.localeCompare(b.talent.name);
    });
  }

  return buckets;
}

export function loadPersistedTabs(storageKey: string): EffectViewTab[] {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (
          item &&
          typeof item === "object" &&
          "category" in item &&
          "subcategory" in item &&
          typeof item.category === "string" &&
          typeof item.subcategory === "string"
        ) {
          const school =
            "school" in item && typeof item.school === "string"
              ? item.school
              : undefined;
          return { category: item.category, subcategory: item.subcategory, school };
        }
        if (typeof item === "string") return parseTabKey(item);
        return null;
      })
      .filter((tab): tab is EffectViewTab => tab !== null);
  } catch {
    return [];
  }
}

export function persistTabs(tabs: EffectViewTab[], storageKey: string): void {
  try {
    if (tabs.length === 0) {
      localStorage.removeItem(storageKey);
      return;
    }
    localStorage.setItem(storageKey, JSON.stringify(tabs));
  } catch {
    // ignore quota / private mode
  }
}

export function toggleTalentInSet(
  id: string,
  selectedIds: ReadonlySet<string>,
  max: number,
  readOnly: boolean,
): Set<string> | null {
  if (readOnly) return null;
  const next = new Set(selectedIds);
  if (next.has(id)) {
    next.delete(id);
    return next;
  }
  if (next.size >= max) return null;
  next.add(id);
  return next;
}
