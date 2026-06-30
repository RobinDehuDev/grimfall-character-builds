import { describe, expect, it } from "vitest";
import { groupCapstonesByClass } from "./capstones";
import type { CapstoneGameItem } from "./types";

function capstone(
  overrides: Partial<CapstoneGameItem> & Pick<CapstoneGameItem, "name" | "wotlkClass">,
): CapstoneGameItem {
  return {
    id: overrides.id ?? "test-id",
    type: "capstone",
    description: "",
    tags: [],
    ...overrides,
  };
}

describe("groupCapstonesByClass", () => {
  it("groups capstones by wotlkClass in playable class order", () => {
    const groups = groupCapstonesByClass([
      capstone({ name: "Starfall", wotlkClass: "druid", id: "1" }),
      capstone({ name: "Dancing Rune Weapon", wotlkClass: "death-knight", id: "2" }),
      capstone({ name: "Fireball", wotlkClass: "mage", id: "3" }),
    ]);

    expect(groups.map((g) => g.wotlkClass)).toEqual([
      "death-knight",
      "druid",
      "mage",
    ]);
    expect(groups[0].capstones[0].name).toBe("Dancing Rune Weapon");
  });

  it("sorts capstones within a class by name", () => {
    const groups = groupCapstonesByClass([
      capstone({ name: "Zebra", wotlkClass: "mage", id: "1" }),
      capstone({ name: "Alpha", wotlkClass: "mage", id: "2" }),
      capstone({ name: "Middle", wotlkClass: "mage", id: "3" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].capstones.map((c) => c.name)).toEqual([
      "Alpha",
      "Middle",
      "Zebra",
    ]);
  });

  it("omits non-playable classes", () => {
    const groups = groupCapstonesByClass([
      capstone({ name: "Hidden", wotlkClass: "unknown", id: "1" }),
      capstone({ name: "Mage", wotlkClass: "mage", id: "2" }),
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].wotlkClass).toBe("mage");
  });
});
