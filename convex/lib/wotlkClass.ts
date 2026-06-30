import {
  WOTLK_CLASS_NAME_BY_SLUG,
  isHiddenWotlkClass,
  normalizeAbilityWotlkClass,
} from "./wotlkClasses";

export {
  displayWotlkClassName,
  normalizeAbilityWotlkClass,
  resolveWotlkClassSlug,
} from "./wotlkClasses";

export function filterByWotlkClass<T extends { wotlkClass?: string }>(
  rows: T[],
  wotlkClass?: string,
) {
  if (!wotlkClass) return rows;
  return rows.filter(
    (row) => normalizeAbilityWotlkClass(row.wotlkClass) === wotlkClass,
  );
}

export function filterHiddenWotlkClasses<T extends { wotlkClass: string }>(
  rows: T[],
  includeHidden: boolean,
) {
  if (includeHidden) return rows;
  return rows.filter(
    (row) => !isHiddenWotlkClass(normalizeAbilityWotlkClass(row.wotlkClass)),
  );
}

export function classNameFromWotlkSlug(wotlkClass: string): string | undefined {
  return WOTLK_CLASS_NAME_BY_SLUG.get(
    normalizeAbilityWotlkClass(wotlkClass) as never,
  );
}
