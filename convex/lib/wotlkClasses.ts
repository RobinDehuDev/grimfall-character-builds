export const WOTLK_CLASSES = [
  { wotlkClass: "death-knight", name: "Death Knight", sortOrder: 1 },
  { wotlkClass: "druid", name: "Druid", sortOrder: 2 },
  { wotlkClass: "hunter", name: "Hunter", sortOrder: 3 },
  { wotlkClass: "mage", name: "Mage", sortOrder: 4 },
  { wotlkClass: "paladin", name: "Paladin", sortOrder: 5 },
  { wotlkClass: "priest", name: "Priest", sortOrder: 6 },
  { wotlkClass: "rogue", name: "Rogue", sortOrder: 7 },
  { wotlkClass: "shaman", name: "Shaman", sortOrder: 8 },
  { wotlkClass: "warlock", name: "Warlock", sortOrder: 9 },
  { wotlkClass: "warrior", name: "Warrior", sortOrder: 10 },
] as const;

export type WotlkClassSlug = (typeof WOTLK_CLASSES)[number]["wotlkClass"];

export const WOTLK_CLASS_NAME_BY_SLUG = new Map(
  WOTLK_CLASSES.map((c) => [c.wotlkClass, c.name]),
);
