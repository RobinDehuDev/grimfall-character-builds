import type { Id } from "../_generated/dataModel";

type ClassDoc = { wotlkClass?: string } | null;

export async function wotlkClassFromClassId(
  ctx: { db: { get: (id: Id<"classes">) => Promise<ClassDoc> } },
  classId?: Id<"classes">,
): Promise<string | undefined> {
  if (!classId) return undefined;
  const gameClass = await ctx.db.get(classId);
  return gameClass?.wotlkClass ?? undefined;
}

export function filterByWotlkClass<T extends { wotlkClass?: string }>(
  rows: T[],
  wotlkClass?: string,
) {
  if (!wotlkClass) return rows;
  return rows.filter((row) => !row.wotlkClass || row.wotlkClass === wotlkClass);
}

export function classNameFromWotlkSlug(
  wotlkClass: string,
  classNameBySlug: Map<string, string>,
): string | undefined {
  return classNameBySlug.get(wotlkClass);
}
