type SearchableItem = {
  name: string;
  description: string;
  tags?: string[];
};

function splitWords(text: string): string[] {
  return text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

export function itemMatchesSearch(
  item: SearchableItem,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;

  const haystack = [item.name, item.description, ...(item.tags ?? [])]
    .join(" ")
    .toLowerCase();

  if (haystack.includes(q)) return true;

  const queryTokens = splitWords(q);
  if (queryTokens.length === 0) return false;

  const words = splitWords(haystack);

  return queryTokens.every((token) =>
    words.some((word) => word.startsWith(token)),
  );
}
