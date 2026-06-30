import { describe, expect, it } from "vitest";
import { filterHiddenItems, isItemHidden } from "../../convex/lib/itemVisibility";

describe("itemVisibility", () => {
  it("treats only hidden === true as hidden", () => {
    expect(isItemHidden({ hidden: true })).toBe(true);
    expect(isItemHidden({ hidden: false })).toBe(false);
    expect(isItemHidden({})).toBe(false);
  });

  it("filters hidden rows unless includeHiddenItems is true", () => {
    const rows = [
      { name: "visible", hidden: false },
      { name: "legacy", hidden: undefined },
      { name: "hidden", hidden: true },
    ];
    expect(filterHiddenItems(rows, false).map((r) => r.name)).toEqual([
      "visible",
      "legacy",
    ]);
    expect(filterHiddenItems(rows, true).map((r) => r.name)).toEqual([
      "visible",
      "legacy",
      "hidden",
    ]);
  });
});
