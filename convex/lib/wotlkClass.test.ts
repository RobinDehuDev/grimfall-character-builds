import { describe, expect, it } from "vitest";
import {
  filterByWotlkClass,
  filterHiddenWotlkClasses,
  normalizeAbilityWotlkClass,
  displayWotlkClassName,
} from "./wotlkClass";

describe("normalizeAbilityWotlkClass", () => {
  it("maps empty and whitespace to unknown", () => {
    expect(normalizeAbilityWotlkClass(undefined)).toBe("unknown");
    expect(normalizeAbilityWotlkClass("")).toBe("unknown");
    expect(normalizeAbilityWotlkClass("   ")).toBe("unknown");
  });

  it("preserves non-empty slugs", () => {
    expect(normalizeAbilityWotlkClass("mage")).toBe("mage");
    expect(normalizeAbilityWotlkClass("  rogue  ")).toBe("rogue");
  });

  it("lowercases slug casing", () => {
    expect(normalizeAbilityWotlkClass("Mage")).toBe("mage");
    expect(normalizeAbilityWotlkClass("DEATH-KNIGHT")).toBe("death-knight");
  });

  it("maps display names to slugs", () => {
    expect(normalizeAbilityWotlkClass("Death Knight")).toBe("death-knight");
    expect(normalizeAbilityWotlkClass("Mage")).toBe("mage");
  });
});

describe("displayWotlkClassName", () => {
  it("shows title case labels for slugs", () => {
    expect(displayWotlkClassName("mage")).toBe("Mage");
    expect(displayWotlkClassName("death-knight")).toBe("Death Knight");
    expect(displayWotlkClassName("unknown")).toBe("Unknown");
  });
});

describe("filterByWotlkClass", () => {
  const rows = [
    { wotlkClass: "mage" },
    { wotlkClass: "" },
    { wotlkClass: "unknown" },
  ];

  it("includes empty rows when filtering unknown", () => {
    expect(filterByWotlkClass(rows, "unknown")).toEqual([
      { wotlkClass: "" },
      { wotlkClass: "unknown" },
    ]);
  });

  it("matches rows with display-name casing", () => {
    expect(
      filterByWotlkClass([{ wotlkClass: "Mage" }, { wotlkClass: "rogue" }], "mage"),
    ).toEqual([{ wotlkClass: "Mage" }]);
  });
});

describe("filterHiddenWotlkClasses", () => {
  it("hides empty class from public lists", () => {
    const rows = [{ wotlkClass: "mage" }, { wotlkClass: "" }];
    expect(filterHiddenWotlkClasses(rows, false)).toEqual([
      { wotlkClass: "mage" },
    ]);
  });
});
