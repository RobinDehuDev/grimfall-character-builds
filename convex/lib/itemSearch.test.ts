import { describe, expect, it } from "vitest";
import { itemMatchesSearch } from "./itemSearch";

describe("itemMatchesSearch", () => {
  const item = {
    name: "Fireball",
    description: "Hurls a fiery ball that causes damage.",
    tags: ["ability", "mage", "fire"],
  };

  it("matches case-insensitively on name", () => {
    expect(itemMatchesSearch(item, "fireball")).toBe(true);
    expect(itemMatchesSearch(item, "FIREBALL")).toBe(true);
    expect(itemMatchesSearch(item, "FiReBaLl")).toBe(true);
  });

  it("matches case-insensitively on description", () => {
    expect(itemMatchesSearch(item, "FIERY")).toBe(true);
  });

  it("matches case-insensitively on tags", () => {
    expect(itemMatchesSearch(item, "MAGE")).toBe(true);
  });

  it("matches token prefixes case-insensitively", () => {
    expect(itemMatchesSearch(item, "Fire bal")).toBe(true);
  });
});
