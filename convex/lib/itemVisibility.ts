export function isItemHidden(row: { hidden?: boolean }) {
  return row.hidden === true;
}

export function filterHiddenItems<T extends { hidden?: boolean }>(
  rows: T[],
  includeHiddenItems: boolean,
) {
  if (includeHiddenItems) return rows;
  return rows.filter((row) => !isItemHidden(row));
}
