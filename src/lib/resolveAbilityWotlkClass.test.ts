import { describe, expect, it } from "vitest";
import {
  applyGeneralClassIfNeeded,
  resolveAbilityWotlkClass,
  shouldUseGeneralClass,
  slugsFromClassField,
} from "../../convex/lib/resolveAbilityWotlkClass";
import { buildWotlkClassIndexes } from "../../convex/lib/resolveAbilityWotlkClass";

describe("resolveAbilityWotlkClass", () => {
  const indexes = buildWotlkClassIndexes();

  it("keeps single-class abilities on their playable slug", () => {
    expect(
      shouldUseGeneralClass("rogue", "Rogue", undefined),
    ).toBe(false);
    expect(
      shouldUseGeneralClass("warrior", "Warrior, Paladin, Hunter", undefined),
    ).toBe(true);
  });

  it("resolves Pick Lock to rogue", () => {
    expect(
      resolveAbilityWotlkClass(
        { wotlkClass: "general", spellId: 1804, externalId: "spell:1804" },
        indexes,
      ),
    ).toBe("rogue");
  });

  it("resolves multi-class weapon skills to general", () => {
    expect(
      resolveAbilityWotlkClass(
        {
          wotlkClass: "warrior",
          spellId: 196,
          classField: "Warrior, Paladin, Hunter, Rogue, Death Knight, Mage, Warlock",
        },
        indexes,
      ),
    ).toBe("general");
  });

  it("does not demote single-class abilities via applyGeneralClassIfNeeded", () => {
    const ability = { wotlkClass: "rogue", treeIndex: undefined };
    applyGeneralClassIfNeeded(ability, "Rogue");
    expect(ability.wotlkClass).toBe("rogue");
  });

  it("parses multi-class source fields", () => {
    expect(slugsFromClassField("Warrior, Hunter, Rogue")).toEqual([
      "warrior",
      "hunter",
      "rogue",
    ]);
  });
});
