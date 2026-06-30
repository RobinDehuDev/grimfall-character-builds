import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  classifyClause,
  parseTalent,
  splitDescription,
  buildReviewReport,
} from "./lib/talentEffectParser.mjs";

const TALENTS_PATH = join(
  process.cwd(),
  "convex/seed/data/wotlk-talents.json",
);

type TalentRow = {
  externalId: string;
  name: string;
  description: string;
  wotlkClass: string;
  treeName?: string;
};

type ExpectedEffect = {
  category: string;
  subcategory: string;
  stat?: string;
  value?: number;
  spellNames?: string[];
};

function loadTalents(): TalentRow[] {
  const data = JSON.parse(readFileSync(TALENTS_PATH, "utf8")) as {
    talents: TalentRow[];
  };
  return data.talents;
}

function talentByName(name: string): TalentRow {
  const talent = loadTalents().find((t) => t.name === name);
  if (!talent) throw new Error(`Talent not found: ${name}`);
  return talent;
}

function expectEffects(
  parsed: ReturnType<typeof parseTalent>,
  expected: ExpectedEffect[],
) {
  expect(parsed.effects).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) {
    const effect = parsed.effects[i];
    const exp = expected[i];
    expect(effect.category, `effect ${i} category`).toBe(exp.category);
    expect(effect.subcategory, `effect ${i} subcategory`).toBe(exp.subcategory);
    if (exp.stat !== undefined) {
      expect(effect.stat, `effect ${i} stat`).toBe(exp.stat);
    }
    if (exp.value !== undefined) {
      expect(effect.value, `effect ${i} value`).toBe(exp.value);
    }
    if (exp.spellNames !== undefined) {
      expect(effect.spellNames, `effect ${i} spellNames`).toEqual(
        expect.arrayContaining(exp.spellNames),
      );
    }
  }
}

describe("splitDescription", () => {
  it("splits past-tense increased clauses", () => {
    const desc =
      "Damage from your Thorns and Entangling Roots increased by 75% and damage done by your Treants increased by 15%.";
    expect(splitDescription(desc)).toEqual([
      "Damage from your Thorns and Entangling Roots increased by 75%",
      "damage done by your Treants increased by 15%",
    ]);
  });

  it("strips In addition prefix", () => {
    const desc =
      "In addition, damage from your Treants and attacks done to you while you have Barkskin active have a 15% chance to daze the target for 3 sec.";
    const clauses = splitDescription(desc);
    expect(clauses[0]).not.toMatch(/^in addition/i);
  });
});

describe("classifyClause direction", () => {
  it("classifies offensive damage from your spells as direct damage", () => {
    const effect = classifyClause(
      "Damage from your Thorns and Entangling Roots increased by 75%",
    );
    expect(effect?.category).toBe("damage");
    expect(effect?.subcategory).toBe("directDamage");
    expect(effect?.value).toBe(75);
  });

  it("classifies debuff damage taken amp as direct damage", () => {
    const effect = classifyClause(
      "increases spell damage taken by 13% for 12 sec",
    );
    expect(effect?.category).toBe("damage");
    expect(effect?.subcategory).toBe("directDamage");
    expect(effect?.value).toBe(13);
  });

  it("classifies self damage reduction with negative value", () => {
    const effect = classifyClause(
      "reduces your damage taken from all spells by 6%",
    );
    expect(effect?.category).toBe("defense");
    expect(effect?.subcategory).toBe("damageReduction");
    expect(effect?.value).toBe(-6);
  });

  it("classifies proc daze as crowd control", () => {
    const effect = classifyClause(
      "have a 15% chance to daze the target for 3 sec",
    );
    expect(effect?.category).toBe("utility");
    expect(effect?.subcategory).toBe("crowdControl");
    expect(effect?.value).toBe(15);
  });
});

describe("parseTalent golden fixtures", () => {
  it("Brambles — spell damage amps and barkskin daze proc", () => {
    const talent = talentByName("Brambles");
    const parsed = parseTalent(talent);
    expectEffects(parsed, [
      {
        category: "damage",
        subcategory: "directDamage",
        stat: "damageDone",
        value: 75,
        spellNames: ["Thorns", "Entangling Roots"],
      },
      {
        category: "pet",
        subcategory: "damageIncrease",
        stat: "petDamage",
        value: 15,
        spellNames: ["Treants"],
      },
      {
        category: "utility",
        subcategory: "crowdControl",
        stat: "daze",
        value: 15,
      },
    ]);
    expect(parsed.effects.some((e) => e.category === "defense")).toBe(false);
  });

  it("Predatory Instincts — melee crit damage and AoE damage taken", () => {
    const parsed = parseTalent(talentByName("Predatory Instincts"));
    expectEffects(parsed, [
      {
        category: "damage",
        subcategory: "directDamage",
        stat: "meleeDamage",
        value: 10,
      },
      {
        category: "defense",
        subcategory: "damageReduction",
        stat: "damageTaken",
        value: -30,
      },
    ]);
  });

  it("Earth and Moon — debuff amp and personal spell damage", () => {
    const parsed = parseTalent(talentByName("Earth and Moon"));
    expectEffects(parsed, [
      {
        category: "damage",
        subcategory: "directDamage",
        stat: "spellDamage",
        value: 13,
      },
      {
        category: "damage",
        subcategory: "directDamage",
        value: 6,
      },
    ]);
  });

  it("Crypt Fever — disease damage amp debuff", () => {
    const parsed = parseTalent(talentByName("Crypt Fever"));
    expectEffects(parsed, [
      {
        category: "damage",
        subcategory: "directDamage",
        stat: "dotDamage",
        value: 30,
      },
    ]);
  });

  it("Ebon Plaguebringer — debuff amp and crit chance", () => {
    const parsed = parseTalent(talentByName("Ebon Plaguebringer"));
    expect(parsed.effects.length).toBeGreaterThanOrEqual(2);
    expect(
      parsed.effects.some(
        (e) => e.category === "damage" && e.subcategory === "directDamage",
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) => e.category === "damage" && e.subcategory === "critChance",
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) => e.category === "defense" && e.subcategory === "damageReduction",
      ),
    ).toBe(false);
  });

  it("Balance of Power — spell hit and spell damage taken reduction", () => {
    const parsed = parseTalent(talentByName("Balance of Power"));
    expectEffects(parsed, [
      { category: "damage", subcategory: "hit", value: 4 },
      {
        category: "defense",
        subcategory: "damageReduction",
        value: -6,
      },
    ]);
  });

  it("Playing with Fire — spell damage caused and taken", () => {
    const parsed = parseTalent(talentByName("Playing with Fire"));
    expectEffects(parsed, [
      { category: "damage", subcategory: "directDamage", value: 3 },
      {
        category: "defense",
        subcategory: "damageReduction",
        stat: "magicDamageTaken",
        value: 3,
      },
    ]);
  });

  it("Inspiration — target physical damage reduction", () => {
    const parsed = parseTalent(talentByName("Inspiration"));
    expectEffects(parsed, [
      {
        category: "defense",
        subcategory: "damageReduction",
        stat: "physicalDamageTaken",
        value: -10,
      },
    ]);
  });

  it("Ancestral Healing — target physical damage reduction", () => {
    const parsed = parseTalent(talentByName("Ancestral Healing"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "defense" &&
          e.subcategory === "damageReduction" &&
          e.value === -10,
      ),
    ).toBe(true);
  });

  it("Glacier Rot — more damage from your spells on diseased enemies", () => {
    const parsed = parseTalent(talentByName("Glacier Rot"));
    expect(
      parsed.effects.every(
        (e) =>
          !(e.category === "defense" && e.subcategory === "damageReduction"),
      ),
    ).toBe(true);
    expect(parsed.effects.some((e) => e.category === "damage")).toBe(true);
  });

  it("Magic Suppression — self magic damage taken reduction", () => {
    const parsed = parseTalent(talentByName("Magic Suppression"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "defense" &&
          e.subcategory === "damageReduction" &&
          e.value !== undefined &&
          e.value < 0,
      ),
    ).toBe(true);
  });

  it("Natural Perfection — crit chance not defense reduction", () => {
    const parsed = parseTalent(talentByName("Natural Perfection"));
    expect(
      parsed.effects.some(
        (e) => e.category === "damage" && e.subcategory === "critChance",
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          /increas/i.test(e.sourcePhrase ?? "") &&
          e.category === "defense" &&
          e.subcategory === "damageReduction",
      ),
    ).toBe(false);
  });

  it("Focused Will — crit effect chance not misclassified as defense", () => {
    const parsed = parseTalent(talentByName("Focused Will"));
    expect(
      parsed.effects.some(
        (e) =>
          /critical effect chance/i.test(e.sourcePhrase ?? "") &&
          e.category === "defense",
      ),
    ).toBe(false);
  });

  it("Pandemic — periodic damage crit and haunt crit damage bonus", () => {
    const parsed = parseTalent(talentByName("Pandemic"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "damage" &&
          (e.subcategory === "critChance" ||
            e.subcategory === "directDamage" ||
            e.subcategory === "dotPeriodic"),
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          /periodic damage from your/i.test(e.sourcePhrase ?? "") &&
          e.category === "defense",
      ),
    ).toBe(false);
    expect(
      parsed.effects.some(
        (e) => e.subcategory === "critDamage" && e.value === 100,
      ),
    ).toBe(true);
  });

  it("Nurturing Instinct — healing done and healing received", () => {
    const parsed = parseTalent(talentByName("Nurturing Instinct"));
    expect(
      parsed.effects.some(
        (e) => e.category === "heal" && e.subcategory === "healingDone",
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) => e.category === "heal" && e.subcategory === "healingReceived",
      ),
    ).toBe(true);
  });

  it("Improved Kidney Shot — target damage amp", () => {
    const parsed = parseTalent(talentByName("Improved Kidney Shot"));
    expect(
      parsed.effects.some(
        (e) => e.category === "damage" && e.subcategory === "directDamage",
      ),
    ).toBe(true);
  });

  it("Primal Gore — periodic bleed damage amp", () => {
    const parsed = parseTalent(talentByName("Primal Gore"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "damage" &&
          /periodic damage from your/i.test(e.sourcePhrase ?? ""),
      ),
    ).toBe(true);
  });

  it("Spell Deflection — parry-based damage taken reduction", () => {
    const parsed = parseTalent(talentByName("Spell Deflection"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "defense" &&
          e.subcategory === "damageReduction" &&
          e.value !== undefined &&
          e.value < 0,
      ),
    ).toBe(true);
  });

  it("Improved Health Funnel — pet defense, resource cost, demon damage reduction", () => {
    const parsed = parseTalent(talentByName("Improved Health Funnel"));
    expectEffects(parsed, [
      {
        category: "pet",
        subcategory: "defense",
        stat: "petHealth",
        value: 20,
      },
      {
        category: "resource",
        subcategory: "cost",
        stat: "abilityCost",
        value: -20,
      },
      {
        category: "pet",
        subcategory: "defense",
        stat: "petDamageTaken",
        value: -30,
      },
    ]);
  });

  it("Unleashed Fury — pet damage increase", () => {
    const parsed = parseTalent(talentByName("Unleashed Fury"));
    expectEffects(parsed, [
      {
        category: "pet",
        subcategory: "damageIncrease",
        stat: "petDamage",
        value: 15,
      },
    ]);
  });

  it("Thick Hide — pet armor and player armor from items", () => {
    const parsed = parseTalent(
      loadTalents().find(
        (t) => t.name === "Thick Hide" && t.wotlkClass === "hunter",
      )!,
    );
    expectEffects(parsed, [
      {
        category: "pet",
        subcategory: "defense",
        stat: "petArmor",
        value: 20,
      },
      {
        category: "defense",
        subcategory: "armor",
        stat: "armor",
        value: 10,
      },
    ]);
  });

  it("Focused Fire — player damage and pet crit on special abilities", () => {
    const parsed = parseTalent(talentByName("Focused Fire"));
    expectEffects(parsed, [
      {
        category: "damage",
        subcategory: "directDamage",
        stat: "damageDone",
        value: 2,
      },
      {
        category: "pet",
        subcategory: "statIncrease",
        stat: "critChance",
        value: 20,
      },
    ]);
  });

  it("Endurance Training — pet health and player total health", () => {
    const parsed = parseTalent(talentByName("Endurance Training"));
    expectEffects(parsed, [
      {
        category: "pet",
        subcategory: "defense",
        stat: "petHealth",
        value: 10,
      },
      {
        category: "defense",
        subcategory: "health",
        stat: "health",
        value: 5,
      },
    ]);
  });

  it("Catlike Reflexes — player dodge and pet dodge", () => {
    const parsed = parseTalent(talentByName("Catlike Reflexes"));
    expect(
      parsed.effects.some(
        (e) => e.category === "defense" && e.subcategory === "avoidance" && e.value === 3,
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "pet" &&
          e.subcategory === "statIncrease" &&
          e.stat === "dodgeChance" &&
          e.value === 9,
      ),
    ).toBe(true);
  });

  it("Serpent's Swiftness — player haste and pet attack speed", () => {
    const parsed = parseTalent(talentByName("Serpent's Swiftness"));
    expectEffects(parsed, [
      { category: "damage", subcategory: "haste", value: 20 },
      {
        category: "pet",
        subcategory: "statIncrease",
        stat: "haste",
        value: 20,
      },
    ]);
  });

  it("Kindred Spirits — pet damage, player movement, pet movement", () => {
    const parsed = parseTalent(talentByName("Kindred Spirits"));
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "pet" &&
          e.subcategory === "damageIncrease" &&
          e.stat === "petDamage" &&
          e.value === 20,
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "utility" &&
          e.subcategory === "movement" &&
          e.stat === "movementSpeed" &&
          e.value === 10,
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "pet" &&
          e.subcategory === "utility" &&
          e.stat === "movementSpeed" &&
          e.value === 10,
      ),
    ).toBe(true);
  });

  it("Hunter vs. Wild — pet attack power from player stamina", () => {
    const parsed = parseTalent(talentByName("Hunter vs. Wild"));
    expect(parsed.effects).toHaveLength(1);
    expect(parsed.effects[0].category).toBe("pet");
    expect(parsed.effects[0].subcategory).toBe("statIncrease");
    expect(parsed.effects[0].stat).toBe("petAttackPower");
  });

  it("Ravenous Dead — player strength and ghoul stat contribution", () => {
    const parsed = parseTalent(talentByName("Ravenous Dead"));
    expectEffects(parsed, [
      { category: "damage", subcategory: "attackPower", stat: "strength", value: 3 },
      {
        category: "pet",
        subcategory: "statIncrease",
        stat: "petAttackPower",
        value: 60,
      },
    ]);
  });

  it("Fel Vitality — demon stats and player health", () => {
    const parsed = parseTalent(talentByName("Fel Vitality"));
    expect(
      parsed.effects.some(
        (e) => e.category === "pet" && e.subcategory === "statIncrease" && e.value === 15,
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) => e.category === "defense" && e.subcategory === "health" && e.value === 3,
      ),
    ).toBe(true);
  });

  it("Demonic Resilience — player crit reduction and demon damage taken", () => {
    const parsed = parseTalent(talentByName("Demonic Resilience"));
    expectEffects(parsed, [
      { category: "damage", subcategory: "critChance", value: 3 },
      {
        category: "pet",
        subcategory: "defense",
        stat: "petDamageTaken",
        value: -15,
      },
    ]);
  });

  it("Improved Demonic Tactics — demon crit from player crit", () => {
    const parsed = parseTalent(talentByName("Improved Demonic Tactics"));
    expect(parsed.effects).toHaveLength(1);
    expect(parsed.effects[0].category).toBe("pet");
    expect(parsed.effects[0].subcategory).toBe("statIncrease");
    expect(parsed.effects[0].stat).toBe("critChance");
  });

  it("Empowered Imp — imp damage and player spell crit proc", () => {
    const parsed = parseTalent(talentByName("Empowered Imp"));
    expectEffects(parsed, [
      {
        category: "pet",
        subcategory: "damageIncrease",
        stat: "petDamage",
        value: 30,
      },
      { category: "damage", subcategory: "hit", stat: "hitChance", value: 100 },
    ]);
  });

  it("Spirit Bond — split player and pet regen and healing received", () => {
    const parsed = parseTalent(talentByName("Spirit Bond"));
    expect(parsed.effects).toHaveLength(4);
    expect(
      parsed.effects.filter((e) => e.category === "pet" && e.subcategory === "defense"),
    ).toHaveLength(2);
    expect(
      parsed.effects.some(
        (e) => e.category === "defense" && e.subcategory === "health",
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) => e.category === "heal" && e.subcategory === "healingReceived" && e.value === 10,
      ),
    ).toBe(true);
    expect(
      parsed.effects.some(
        (e) =>
          e.category === "pet" &&
          e.subcategory === "defense" &&
          e.stat === "petHealth" &&
          e.value === 10,
      ),
    ).toBe(true);
  });

  it("Improved Mend Pet — player cost and pet dispel utility", () => {
    const parsed = parseTalent(talentByName("Improved Mend Pet"));
    expectEffects(parsed, [
      { category: "resource", subcategory: "cost", stat: "manaCost", value: -10 },
      { category: "pet", subcategory: "utility", stat: "petUtility" },
    ]);
  });
});

describe("parseTalent corpus quality", () => {
  const talents = loadTalents();
  const parsed = talents.map(parseTalent);
  const report = buildReviewReport(parsed);

  it("parses every talent with at least one effect", () => {
    const missing = parsed.filter((t) => t.effects.length === 0);
    expect(missing.map((t) => t.name)).toEqual([]);
  });

  it("has zero increased-classified-as-reduction issues", () => {
    expect(report.summary.increasedAsReduction).toBe(0);
  });

  it("has zero proc CC classified as defense", () => {
    expect(report.summary.procCcAsDefense).toBe(0);
  });

  it("has no positive damageReduction without less/reduce phrasing", () => {
    const bad = parsed.flatMap((t) =>
      t.effects
        .filter(
          (e) =>
            e.category === "defense" &&
            e.subcategory === "damageReduction" &&
            (e.value ?? 0) > 0 &&
            !/less|reduc|decreas/i.test(e.sourcePhrase ?? "") &&
            !/(?:spell |magic |all )?damage taken by \d+%/i.test(e.sourcePhrase ?? ""),
        )
        .map((e) => ({ talent: t.name, phrase: e.sourcePhrase })),
    );
    expect(bad).toEqual([]);
  });

  it("has no pet damage taken reduction misclassified as player defense", () => {
    const bad = parsed.flatMap((t) =>
      t.effects
        .filter(
          (e) =>
            e.category === "defense" &&
            e.subcategory === "damageReduction" &&
            (/(?:pet|pets|summoned demon|demon)\s+takes?\s+.*less damage/i.test(
              e.sourcePhrase ?? "",
            ) ||
              /pet takes .* less damage/i.test(e.sourcePhrase ?? "")),
        )
        .map((e) => ({ talent: t.name, phrase: e.sourcePhrase })),
    );
    expect(bad).toEqual([]);
  });

  it("has zero pet beneficiary misclassifications in review report", () => {
    expect(report.summary.petMisclassified).toBe(0);
  });

  it("has no pet-targeted damage on player directDamage", () => {
    const bad = parsed.flatMap((t) =>
      t.effects
        .filter(
          (e) =>
            e.category === "damage" &&
            e.subcategory === "directDamage" &&
            /damage done by your (?:pet|pets|imp)\b/i.test(e.sourcePhrase ?? "") &&
            !/increase your spell critical/i.test(e.sourcePhrase ?? ""),
        )
        .map((e) => ({ talent: t.name, phrase: e.sourcePhrase })),
    );
    expect(bad).toEqual([]);
  });
});

describe("parseTalent per-class samples", () => {
  const talents = loadTalents();
  const byClass = new Map<string, TalentRow[]>();
  for (const talent of talents) {
    const list = byClass.get(talent.wotlkClass) ?? [];
    list.push(talent);
    byClass.set(talent.wotlkClass, list);
  }

  for (const [wotlkClass, classTalents] of byClass) {
    it(`${wotlkClass} — sample talents parse with high-confidence effects`, () => {
      const samples = classTalents.filter((_, i) => i % 7 === 0);
      for (const talent of samples) {
        const parsed = parseTalent(talent);
        expect(parsed.effects.length, talent.name).toBeGreaterThan(0);
        const allLow = parsed.effects.every((e) => e.confidence === "low");
        expect(allLow, talent.name).toBe(false);
      }
    });
  }
});
