const SCHOOL_KEYWORDS = [
  "arcane",
  "fire",
  "frost",
  "shadow",
  "holy",
  "nature",
  "physical",
  "blood",
  "unholy",
  "elemental",
  "restoration",
  "enhancement",
  "beast",
  "marksmanship",
  "survival",
  "assassination",
  "combat",
  "subtlety",
  "protection",
  "retribution",
  "discipline",
  "fury",
  "arms",
  "affliction",
  "demonology",
  "destruction",
  "balance",
  "feral",
  "guardian",
  "mistweaver",
  "brewmaster",
  "windwalker",
] as const;

export function computeItemTags(opts: {
  name: string;
  description: string;
  wotlkClass?: string;
  className?: string;
  treeName?: string;
  kind: "talent" | "capstone" | "ability";
}): string[] {
  const tags = new Set<string>([opts.kind]);
  if (opts.wotlkClass) {
    tags.add(opts.wotlkClass);
    tags.add(opts.wotlkClass.replace(/-/g, " "));
  }
  if (opts.className) tags.add(opts.className.toLowerCase());
  if (opts.treeName) tags.add(opts.treeName.toLowerCase());
  const text = `${opts.name} ${opts.description}`.toLowerCase();
  for (const kw of SCHOOL_KEYWORDS) {
    if (text.includes(kw)) tags.add(kw);
  }
  return [...tags];
}

export { itemMatchesSearch } from "./itemSearch";
