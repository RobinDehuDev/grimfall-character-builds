#!/usr/bin/env node
/**
 * Parses WotLK talent descriptions into draft Effect rows for taxonomy review.
 * Outputs data/talent-effect-taxonomy.json, data/talent-effect-drafts.json,
 * data/talent-effect-review-report.json, and convex/seed/data/talent-effects.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  SCHOOLS,
  buildReviewReport,
  parseTalent,
  toStorableEffect,
} from "./lib/talentEffectParser.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const TALENTS_PATH = join(ROOT, "convex/seed/data/wotlk-talents.json");
const TAXONOMY_OUT = join(ROOT, "data/talent-effect-taxonomy.json");
const DRAFTS_OUT = join(ROOT, "data/talent-effect-drafts.json");
const REVIEW_OUT = join(ROOT, "data/talent-effect-review-report.json");
const SEED_EFFECTS_OUT = join(ROOT, "convex/seed/data/talent-effects.json");
const PREVIOUS_SEED_PATH = SEED_EFFECTS_OUT;

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildStatsList() {
  const stats = [
    { id: "strength", label: "Strength", category: "damage" },
    { id: "agility", label: "Agility", category: "damage" },
    { id: "stamina", label: "Stamina", category: "defense" },
    { id: "intellect", label: "Intellect", category: "resource" },
    { id: "spirit", label: "Spirit", category: "resource" },
    { id: "allAttributes", label: "All attributes", category: "damage" },
    { id: "attackPower", label: "Attack power", category: "damage" },
    { id: "spellPower", label: "Spell power", category: "damage" },
    { id: "rangedAttackPower", label: "Ranged attack power", category: "damage" },
    { id: "attackPowerFromArmor", label: "Attack power from armor", category: "damage" },
    { id: "spellPowerFromSpirit", label: "Spell power from spirit", category: "damage" },
    { id: "critChance", label: "Critical strike chance", category: "damage" },
    { id: "critDamageBonus", label: "Critical strike damage bonus", category: "damage" },
    { id: "hitChance", label: "Hit chance", category: "damage" },
    { id: "expertise", label: "Expertise", category: "damage" },
    { id: "haste", label: "Haste", category: "damage" },
    { id: "attackSpeed", label: "Attack speed", category: "damage" },
    { id: "dodgeChance", label: "Dodge chance", category: "defense" },
    { id: "parryChance", label: "Parry chance", category: "defense" },
    { id: "blockChance", label: "Block chance", category: "defense" },
    { id: "blockValue", label: "Block value", category: "defense" },
    { id: "armorPenetration", label: "Armor penetration", category: "damage" },
    { id: "spellPenetration", label: "Spell penetration", category: "damage" },
    { id: "defenseRating", label: "Defense rating", category: "defense" },
    { id: "damageDone", label: "Damage done", category: "damage" },
    { id: "damageTaken", label: "Damage taken", category: "defense" },
    { id: "spellDamage", label: "Spell damage", category: "damage" },
    { id: "meleeDamage", label: "Melee damage", category: "damage" },
    { id: "rangedDamage", label: "Ranged damage", category: "damage" },
    { id: "weaponDamage", label: "Weapon damage", category: "damage" },
    { id: "dotDamage", label: "DoT damage", category: "damage" },
    { id: "bleedDamage", label: "Bleed damage", category: "damage" },
    { id: "periodicDamage", label: "Periodic damage", category: "damage" },
    { id: "healingDone", label: "Healing done", category: "heal" },
    { id: "healingReceived", label: "Healing received", category: "heal" },
    { id: "amountHealed", label: "Amount healed", category: "heal" },
    { id: "absorbAmount", label: "Absorb amount", category: "heal" },
    { id: "hotHealing", label: "Heal over time", category: "heal" },
    { id: "armor", label: "Armor", category: "defense" },
    { id: "allResistances", label: "All resistances", category: "defense" },
    { id: "damageReduction", label: "Damage reduction", category: "defense" },
    { id: "shieldAbsorb", label: "Shield absorb", category: "defense" },
    { id: "mana", label: "Mana", category: "resource" },
    { id: "rage", label: "Rage", category: "resource" },
    { id: "energy", label: "Energy", category: "resource" },
    { id: "runicPower", label: "Runic power", category: "resource" },
    { id: "focus", label: "Focus", category: "resource" },
    { id: "healthRegen", label: "Health regeneration", category: "defense" },
    { id: "manaRegen", label: "Mana regeneration", category: "resource" },
    { id: "rageGenerated", label: "Rage generated", category: "resource" },
    { id: "runicPowerGenerated", label: "Runic power generated", category: "resource" },
    { id: "cooldown", label: "Cooldown", category: "resource" },
    { id: "cooldownReduction", label: "Cooldown reduction", category: "resource" },
    { id: "manaCost", label: "Mana cost", category: "resource" },
    { id: "abilityCost", label: "Ability cost", category: "resource" },
    { id: "castTime", label: "Cast time", category: "utility" },
    { id: "channelTime", label: "Channel time", category: "utility" },
    { id: "duration", label: "Duration", category: "utility" },
    { id: "range", label: "Range", category: "utility" },
    { id: "threatGenerated", label: "Threat generated", category: "utility" },
    { id: "movementSpeed", label: "Movement speed", category: "utility" },
    { id: "procChance", label: "Proc chance", category: "utility" },
    { id: "petDamage", label: "Pet damage", category: "pet" },
    { id: "petHealth", label: "Pet health", category: "pet" },
    { id: "petArmor", label: "Pet armor", category: "pet" },
    { id: "petAttackPower", label: "Pet attack power", category: "pet" },
    { id: "petDamageTaken", label: "Pet damage taken", category: "pet" },
    { id: "petUtility", label: "Pet utility", category: "pet" },
  ];
  for (const school of SCHOOLS) {
    stats.push({
      id: `schoolDamage_${school}`,
      label: `${capitalize(school)} damage`,
      category: "damage",
    });
    stats.push({
      id: `schoolResist_${school}`,
      label: `${capitalize(school)} resistance`,
      category: "defense",
    });
  }
  return stats;
}

/** Static taxonomy vocabulary */
const TAXONOMY_VOCAB = {
  version: 1,
  categories: [
    {
      id: "damage",
      label: "Damage",
      subcategories: [
        { id: "directDamage", label: "Direct damage", stats: ["damageDone", "weaponDamage", "bleedDamage", "meleeDamage", "rangedDamage"] },
        { id: "critChance", label: "Critical strike chance", stats: ["critChance"] },
        { id: "critDamage", label: "Critical strike damage", stats: ["critDamageBonus"] },
        { id: "attackPower", label: "Attack power", stats: ["attackPower", "rangedAttackPower", "attackPowerFromArmor"] },
        { id: "spellPower", label: "Spell power / spell damage", stats: ["spellPower", "spellDamage", "spellPowerFromSpirit"] },
        { id: "weaponSpecialization", label: "Weapon specialization", stats: ["twoHandWeaponDamage", "dualWield", "weaponDamage"] },
        { id: "schoolDamage", label: "School-specific damage", stats: SCHOOLS.map((s) => `schoolDamage_${s}`) },
        { id: "dotPeriodic", label: "Damage over time / periodic", stats: ["dotDamage", "periodicDamage"] },
        { id: "hit", label: "Hit chance", stats: ["hitChance", "missChance"] },
        { id: "expertise", label: "Expertise", stats: ["expertise"] },
        { id: "haste", label: "Haste / attack speed", stats: ["haste", "attackSpeed"] },
        { id: "range", label: "Range", stats: ["spellRange", "meleeRange", "range"] },
        { id: "penetration", label: "Penetration", stats: ["armorPenetration", "spellPenetration"] },
      ],
    },
    {
      id: "defense",
      label: "Defense",
      subcategories: [
        { id: "damageReduction", label: "Damage reduction", stats: ["damageTaken", "magicDamageTaken", "physicalDamageTaken", "damageReduction"] },
        { id: "armor", label: "Armor", stats: ["armor", "armorFromItems", "bearFormArmor", "devotionAuraArmor"] },
        { id: "avoidance", label: "Avoidance", stats: ["dodgeChance", "parryChance", "blockChance", "blockValue"] },
        { id: "resist", label: "Resistances", stats: ["allResistances", ...SCHOOLS.map((s) => `schoolResist_${s}`)] },
        { id: "shield", label: "Shields / absorbs", stats: ["shieldAbsorb", "antiMagicShell"] },
        { id: "health", label: "Health / stamina", stats: ["health", "stamina", "maxHealth"] },
      ],
    },
    {
      id: "heal",
      label: "Heal",
      subcategories: [
        { id: "healingDone", label: "Healing done", stats: ["healingDone", "amountHealed"] },
        { id: "healingReceived", label: "Healing received / absorb", stats: ["healingReceived", "absorbAmount"] },
        { id: "hot", label: "Heal over time", stats: ["hotHealing"] },
        { id: "manaEfficiency", label: "Healing mana efficiency", stats: ["healingPerMana", "manaCost"] },
      ],
    },
    {
      id: "resource",
      label: "Resource",
      subcategories: [
        { id: "mana", label: "Mana", stats: ["mana", "manaRegen", "manaOnCast"] },
        { id: "rage", label: "Rage", stats: ["rage", "rageGenerated"] },
        { id: "energy", label: "Energy", stats: ["energy", "energyRegen"] },
        { id: "runicPower", label: "Runic power", stats: ["runicPower", "runicPowerGenerated"] },
        { id: "focus", label: "Focus", stats: ["focus"] },
        { id: "cooldown", label: "Cooldown", stats: ["cooldown", "cooldownReduction"] },
        { id: "cost", label: "Ability cost", stats: ["manaCost", "abilityCost"] },
        { id: "regen", label: "Regeneration", stats: ["healthRegen", "resourceRegen", "manaRegen"] },
      ],
    },
    {
      id: "utility",
      label: "Utility",
      subcategories: [
        { id: "threat", label: "Threat", stats: ["threatGenerated", "threatReduction"] },
        { id: "movement", label: "Movement speed", stats: ["movementSpeed"] },
        { id: "castTime", label: "Cast time", stats: ["castTime", "channelTime"] },
        { id: "duration", label: "Duration", stats: ["effectDuration", "debuffDuration", "duration"] },
        { id: "crowdControl", label: "Crowd control", stats: ["stun", "fear", "silence", "root", "disarm", "snare"] },
        { id: "dispel", label: "Dispel", stats: ["dispelResistance", "dispelChance"] },
        { id: "procMechanic", label: "Proc / buff / mechanic", stats: ["procChance", "grantsBuff", "freeCast", "summon", "auraRadius"] },
      ],
    },
    {
      id: "pet",
      label: "Pet",
      subcategories: [
        { id: "damageIncrease", label: "Damage increase", stats: ["petDamage"] },
        {
          id: "statIncrease",
          label: "Stat increase",
          stats: ["petAttackPower", "critChance", "haste"],
        },
        {
          id: "defense",
          label: "Defense",
          stats: ["petHealth", "petArmor", "petDamageTaken"],
        },
        { id: "utility", label: "Utility", stats: ["petUtility", "grantsBuff"] },
      ],
    },
  ],
  stats: buildStatsList(),
  typeOfEffect: ["flat", "percentage", "duration", "distance", "boolean"],
  effectFields: [
    { id: "duration", label: "Effect duration (seconds)", note: "Omit until duration data is available" },
    { id: "recurrence", label: "Periodic effect", note: "true when effect ticks on an interval" },
    { id: "recurrenceInSeconds", label: "Recurrence interval (seconds)", note: "e.g. per 5 sec → 5" },
    {
      id: "scope",
      label: "Effect scope",
      note: "Optional attackType (melee|ranged|spell) and school for school-specific effects",
    },
  ],
  conditionPatterns: [
    { id: "when_you", label: "When / Whenever you…", example: "When you critically hit… / Whenever you kill an enemy…" },
    { id: "after_you", label: "After you…", example: "After you Dodge or Parry an attack…" },
    { id: "proc_chance", label: "Percent chance proc", example: "You have a 15% chance after dodging…" },
    { id: "on_hit_taken", label: "On taking damage / hit", example: "When struck in melee…" },
    { id: "after_avoidance", label: "After dodge/parry/block", example: "After dodging, parrying or blocking…" },
    { id: "on_cooldown_trigger", label: "On cooldown state", example: "Whenever your Blood Runes are on cooldown…" },
    { id: "in_presence", label: "In presence/stance/form", example: "While in Blood or Unholy Presence…" },
    { id: "while_state", label: "While in state", example: "While in combat…" },
    { id: "in_combat", label: "In combat", example: "While in combat you generate…" },
    { id: "on_crit", label: "On critical strike", example: "After dealing a critical strike…" },
    { id: "on_kill", label: "On kill", example: "Whenever you kill an enemy…" },
  ],
};

function main() {
  const talentData = JSON.parse(readFileSync(TALENTS_PATH, "utf8"));
  const talents = talentData.talents;
  const parsed = talents.map(parseTalent);

  const previousSeed = existsSync(PREVIOUS_SEED_PATH)
    ? JSON.parse(readFileSync(PREVIOUS_SEED_PATH, "utf8"))
    : null;
  const reviewReport = buildReviewReport(parsed, previousSeed);

  const unparsed = parsed
    .filter((t) => t.effects.length === 0)
    .map((t) => ({
      externalId: t.externalId,
      name: t.name,
      reason: "no_matching_clause",
      description: t.description,
    }));

  const summary = {
    effectsParsed: parsed.reduce((n, t) => n + t.effects.length, 0),
    talentsWithEffects: parsed.filter((t) => t.effects.length > 0).length,
    talentsWithoutEffects: unparsed.length,
    highConfidence: parsed.reduce(
      (n, t) => n + t.effects.filter((e) => e.confidence === "high").length,
      0,
    ),
    mediumConfidence: parsed.reduce(
      (n, t) => n + t.effects.filter((e) => e.confidence === "medium").length,
      0,
    ),
    lowConfidence: parsed.reduce(
      (n, t) => n + t.effects.filter((e) => e.confidence === "low").length,
      0,
    ),
    needsReview: parsed.filter((t) => t.reviewFlags.length > 0).length,
    byCategory: {},
    bySubcategory: {},
    review: reviewReport.summary,
  };

  for (const t of parsed) {
    for (const e of t.effects) {
      summary.byCategory[e.category] = (summary.byCategory[e.category] || 0) + 1;
      const key = `${e.category}.${e.subcategory}`;
      summary.bySubcategory[key] = (summary.bySubcategory[key] || 0) + 1;
    }
  }

  const taxonomy = {
    ...TAXONOMY_VOCAB,
    generatedAt: new Date().toISOString(),
    talentCount: talents.length,
    summary,
  };

  const drafts = {
    version: 1,
    generatedAt: new Date().toISOString(),
    talentCount: talents.length,
    talents: parsed,
    unparsed,
  };

  writeFileSync(TAXONOMY_OUT, JSON.stringify(taxonomy, null, 2) + "\n");
  writeFileSync(DRAFTS_OUT, JSON.stringify(drafts, null, 2) + "\n");
  writeFileSync(REVIEW_OUT, JSON.stringify(reviewReport, null, 2) + "\n");

  const effectsByExternalId = {};
  for (const t of parsed) {
    if (!t.externalId || t.effects.length === 0) continue;
    effectsByExternalId[t.externalId] = t.effects.map(toStorableEffect);
  }
  const seedEffects = {
    version: 1,
    generatedAt: new Date().toISOString(),
    talentCount: Object.keys(effectsByExternalId).length,
    effectsByExternalId,
  };
  writeFileSync(SEED_EFFECTS_OUT, JSON.stringify(seedEffects, null, 2) + "\n");

  console.log(`Wrote ${TAXONOMY_OUT}`);
  console.log(`Wrote ${DRAFTS_OUT}`);
  console.log(`Wrote ${REVIEW_OUT}`);
  console.log(`Wrote ${SEED_EFFECTS_OUT}`);
  console.log(`Talents: ${talents.length}`);
  console.log(`Effects parsed: ${summary.effectsParsed}`);
  console.log(`Talents without effects: ${summary.talentsWithoutEffects}`);
  console.log(
    `Confidence — high: ${summary.highConfidence}, medium: ${summary.mediumConfidence}, low: ${summary.lowConfidence}`,
  );
  console.log(`Needs review: ${summary.needsReview}`);
  console.log(`Review — increased as reduction: ${reviewReport.summary.increasedAsReduction}`);
  console.log(`Review — proc CC as defense: ${reviewReport.summary.procCcAsDefense}`);
  console.log(`Review — clause mismatches: ${reviewReport.summary.clauseMismatches}`);
  console.log(`Review — pet misclassified: ${reviewReport.summary.petMisclassified}`);
  console.log(`Diff from previous seed: ${reviewReport.diffCount} talents changed`);
}

main();
