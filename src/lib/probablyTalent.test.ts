import { describe, expect, it } from "vitest";
import {
  buildProbablyTalentIndexes,
  isProbablyTalent,
  PROBABLY_TALENT_SKIP_CLASS,
} from "../../convex/lib/probablyTalent";

describe("probablyTalent matching", () => {
  const indexes = buildProbablyTalentIndexes();

  it("skips death-knight", () => {
    expect(
      isProbablyTalent(
        {
          wotlkClass: PROBABLY_TALENT_SKIP_CLASS,
          name: "Heart Strike",
          externalId: "spell:55050",
        },
        indexes,
      ),
    ).toBe(false);
  });

  it("matches talent name", () => {
    expect(
      isProbablyTalent(
        { wotlkClass: "mage", name: "Arcane Subtlety" },
        indexes,
      ),
    ).toBe(true);
  });

  it("matches grid spell externalId", () => {
    expect(
      isProbablyTalent(
        {
          wotlkClass: "rogue",
          name: "Adrenaline Rush",
          externalId: "rogue_combat_adrenaline_rush",
        },
        indexes,
      ),
    ).toBe(true);
  });

  it("does not match unrelated spellbook ability", () => {
    expect(
      isProbablyTalent({ wotlkClass: "mage", name: "Fireball" }, indexes),
    ).toBe(false);
  });
});
