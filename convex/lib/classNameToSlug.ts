/** Maps WoW class display names to wotlkClass slugs. */
export const CLASS_NAME_TO_WOTLK_SLUG: Record<string, string> = {
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

export function wotlkSlugFromClassField(classField: string): string | undefined {
  const primary = classField.split(",")[0]?.trim();
  if (!primary) return undefined;
  return CLASS_NAME_TO_WOTLK_SLUG[primary];
}
