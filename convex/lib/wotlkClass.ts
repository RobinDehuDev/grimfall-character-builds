import { WOTLK_CLASS_NAME_BY_SLUG } from "./wotlkClasses";

export function filterByWotlkClass<T extends { wotlkClass?: string }>(
  rows: T[],
  wotlkClass?: string,
) {
  if (!wotlkClass) return rows;
  return rows.filter((row) => !row.wotlkClass || row.wotlkClass === wotlkClass);
}

export function classNameFromWotlkSlug(wotlkClass: string): string | undefined {
  return WOTLK_CLASS_NAME_BY_SLUG.get(wotlkClass as never);
}
