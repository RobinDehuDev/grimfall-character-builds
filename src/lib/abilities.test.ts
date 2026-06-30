import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  abilitySpecLabel,
  groupAbilitiesBySpec,
  sortAbilitiesByLevel,
} from "./abilities";
import type { AbilityGameItem } from "./types";
import { fromConvexAbility } from "./types";

const grimfallAbilities = JSON.parse(
  readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), "../../convex/seed/data/grimfall-abilities.json"),
    "utf8",
  ),
).abilities as Array<Record<string, unknown>>;

const HIDDEN_CLASSES = new Set([
  "racials",
  "dnd",
  "unknown",
  "profession",
  "general",
]);

function ability(
  overrides: Partial<AbilityGameItem> & Pick<AbilityGameItem, "name">,
): AbilityGameItem {
  return {
    id: overrides.id ?? "test-id",
    type: "ability",
    description: "",
    wotlkClass: overrides.wotlkClass ?? "druid",
    levelRequirement: overrides.levelRequirement ?? 1,
    order: overrides.order ?? 0,
    tags: [],
    ...overrides,
  };
}

describe("sortAbilitiesByLevel", () => {
  it("sorts by level, then order, then name", () => {
    const abilities = [
      ability({ name: "Beta", levelRequirement: 10, order: 1 }),
      ability({ name: "Alpha", levelRequirement: 10, order: 0 }),
      ability({ name: "Gamma", levelRequirement: 20, order: 0 }),
    ];

    expect([...abilities].sort(sortAbilitiesByLevel).map((a) => a.name)).toEqual([
      "Alpha",
      "Beta",
      "Gamma",
    ]);
  });
});

describe("groupAbilitiesBySpec", () => {
  it("prefers treeIndex over misleading skillLineIds for druid Feral", () => {
    const groups = groupAbilitiesBySpec(
      [
        ability({
          name: "Mangle",
          treeIndex: 1,
          treeName: "Feral Combat",
          skillLineIds: [134],
        }),
      ],
      "druid",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Feral");
    expect(groups[0].abilities[0].name).toBe("Mangle");
  });

  it("prefers treeIndex over misleading skillLineIds for priest Shadow", () => {
    const groups = groupAbilitiesBySpec(
      [
        ability({
          name: "Shadow Word: Pain",
          wotlkClass: "priest",
          treeIndex: 2,
          treeName: "Shadow Magic",
          skillLineIds: [56],
        }),
      ],
      "priest",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Shadow");
  });

  it("falls back to skillLineIds when treeIndex is missing", () => {
    const groups = groupAbilitiesBySpec(
      [
        ability({
          name: "Wrath",
          treeIndex: undefined,
          skillLineIds: [573],
        }),
      ],
      "druid",
    );

    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Balance");
  });
});

describe("abilitySpecLabel", () => {
  it("prefers treeIndex over skillLineIds", () => {
    expect(abilitySpecLabel("druid", [134], 1)).toBe("Feral");
  });

  it("falls back to skillLineIds when treeIndex is missing", () => {
    expect(abilitySpecLabel("druid", [573])).toBe("Balance");
  });
});

describe("grimfall seed data", () => {
  it("places every playable ability in the column matching stored treeIndex", () => {
    const playableClasses = [
      ...new Set(
        grimfallAbilities
          .map((a) => a.wotlkClass as string)
          .filter((cls) => !HIDDEN_CLASSES.has(cls)),
      ),
    ];

    let mismatches = 0;
    for (const cls of playableClasses) {
      const abilities = grimfallAbilities
        .filter((a) => a.wotlkClass === cls)
        .map((a, i) =>
          fromConvexAbility({
            ...a,
            tags: (a.tags as string[]) ?? [],
            _id: `seed-${i}`,
            _creationTime: 0,
          } as never),
        );
      const groups = groupAbilitiesBySpec(
        abilities,
        cls as Parameters<typeof groupAbilitiesBySpec>[1],
      );
      for (const group of groups) {
        if (group.treeIndex == null) continue;
        for (const row of group.abilities) {
          if (row.treeIndex !== group.treeIndex) mismatches += 1;
        }
      }
    }

    expect(mismatches).toBe(0);
  });
});

describe("wowhead merged abilities", () => {
  const wotlkAbilities = JSON.parse(
    readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "../../convex/seed/data/wotlk-abilities.json"),
      "utf8",
    ),
  ).abilities as Array<{ wotlkClass: string; name: string; spellId?: number }>;

  function classNameKey(row: { wotlkClass: string; name: string }) {
    return `${row.wotlkClass}|${row.name.toLowerCase()}`;
  }

  it("includes wowhead-only abilities hidden by default", () => {
    const wowheadRows = grimfallAbilities.filter((a) => a.addedFromWowhead === true);
    expect(wowheadRows.length).toBeGreaterThanOrEqual(86);
    expect(wowheadRows.every((a) => a.hidden === true)).toBe(true);
  });

  it("contains known missing death knight spells", () => {
    const names = new Set(
      grimfallAbilities.map((a) => a.name as string),
    );
    for (const name of [
      "Dark Command",
      "Rune Tap",
      "Heart Strike",
      "Unholy Frenzy",
    ]) {
      expect(names.has(name)).toBe(true);
    }
  });

  it("covers every unique wotlk row not already in the base grimfall seed", () => {
    const baseSpellIds = new Set(
      grimfallAbilities
        .filter((a) => !a.addedFromWowhead)
        .map((a) => a.spellId)
        .filter((id) => id != null),
    );
    const baseClassNames = new Set(
      grimfallAbilities
        .filter((a) => !a.addedFromWowhead)
        .map((a) => classNameKey(a as { wotlkClass: string; name: string })),
    );
    const allSpellIds = new Set(
      grimfallAbilities.map((a) => a.spellId).filter((id) => id != null),
    );
    const allClassNames = new Set(
      grimfallAbilities.map((a) =>
        classNameKey(a as { wotlkClass: string; name: string }),
      ),
    );

    const seenWotlkKeys = new Set<string>();
    let expectedWowhead = 0;
    for (const row of wotlkAbilities) {
      const rowKey = classNameKey(row);
      if (seenWotlkKeys.has(rowKey)) continue;
      seenWotlkKeys.add(rowKey);

      if (
        (row.spellId != null && baseSpellIds.has(row.spellId)) ||
        baseClassNames.has(rowKey)
      ) {
        continue;
      }
      expectedWowhead += 1;
      expect(
        (row.spellId != null && allSpellIds.has(row.spellId)) ||
          allClassNames.has(rowKey),
      ).toBe(true);
    }

    expect(
      grimfallAbilities.filter((a) => a.addedFromWowhead === true).length,
    ).toBe(expectedWowhead);
  });
});

describe("probably talent flagged abilities", () => {
  it("never flags death-knight abilities", () => {
    const dkFlagged = grimfallAbilities.filter(
      (a) => a.wotlkClass === "death-knight" && a.probablyTalent === true,
    );
    expect(dkFlagged).toHaveLength(0);
  });

  it("flags known talent duplicates as hidden", () => {
    const flagged = grimfallAbilities.filter((a) => a.probablyTalent === true);
    expect(flagged.length).toBeGreaterThanOrEqual(300);
    expect(flagged.every((a) => a.hidden === true)).toBe(true);
    expect(flagged.every((a) => a.wotlkClass !== "death-knight")).toBe(true);
  });

  it("flags rogue Adrenaline Rush and mage Arcane Power", () => {
    const byKey = new Map(
      grimfallAbilities.map((a) => [
        `${a.wotlkClass as string}|${a.name as string}`,
        a,
      ]),
    );
    expect(byKey.get("rogue|Adrenaline Rush")?.probablyTalent).toBe(true);
    expect(byKey.get("mage|Arcane Power")?.probablyTalent).toBe(true);
  });

  it("does not flag mage Fireball as probably talent", () => {
    const fireball = grimfallAbilities.find(
      (a) => a.wotlkClass === "mage" && a.name === "Fireball",
    );
    if (fireball) {
      expect(fireball.probablyTalent).not.toBe(true);
    }
  });
});
