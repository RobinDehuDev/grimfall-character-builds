import { internalMutation } from "../_generated/server";

export const LEGENDARY_RUNIC_ENHANCEMENTS = [
  {
    name: "Rune of Atonement",
    description:
      "Toggleable healer-focused rune. When activated (3 sec cast, 10 sec cooldown), your spell damage and physical damage are reduced. Single-target spell damage you deal heals both yourself and the lowest-health ally. Available from the General spellbook and no longer offered to non-Healer roles.",
  },
  {
    name: "Rune of Haunting Reverberations",
    description:
      "When Haunt expires, it automatically reapplies itself to a random target. The reverberated Haunt also applies or refreshes your Shadow damage-over-time effects on that target.",
  },
  {
    name: "Rune of the Icy Winds of Northrend",
    description:
      "Casting Howling Blast calls down a Blizzard on your primary target, adding sustained Frost area damage around the struck enemy.",
  },
  {
    name: "Rune of the Thunderous Gale",
    description:
      "Thunder Clap unleashes Thunderous Gale, a Hurricane-like storm effect that damages nearby enemies, applies its slow effect correctly, and now scales directly from the damage dealt by your Thunder Clap.",
  },
  {
    name: "Rune of Deepening Frost",
    description:
      "Icy Touch applies Permafrost, increasing the Frost damage you deal to the target. Permafrost stacks up to 3 times. The effect only applies when Icy Touch hits and Permafrost itself can no longer miss once applied.",
  },
  {
    name: "Rune of Twice-Burned Flesh",
    description:
      "Fireball ignites a second blaze within the target, automatically applying Immolate. The effect now functions correctly even while moving.",
  },
  {
    name: "Rune of the Accursed Bolt",
    description:
      "Shadow Bolt afflicts its victim with a random half-rank curse. The original Shadow Bolt damage bonus has been removed. Triggering for cast-time Shadow DoTs has been improved and applied DoTs no longer overwrite higher-rank versions.",
  },
  {
    name: "Rune of the Purifying Fires of the Silver Hand",
    description:
      "Crusader Strike invokes the Light and engulfs the target in Holy Fire. Triggering reliability has been improved, including while moving.",
  },
  {
    name: "Rune of the Crimson Scar",
    description:
      "Rend leaves a permanent Crimson Scar that persists indefinitely until the affected enemy dies.",
  },
  {
    name: "Rune of the Stormcaller's Cascading Elements",
    description:
      "Stormstrike causes elemental surges that immediately reset and allow reuse of your Shaman Shock abilities. Includes a unique visual effect when Shock cooldowns are refreshed.",
  },
  {
    name: "Rune of the Shocking Rush of the Inferno",
    description:
      "Applying Flame Shock grants Inferno Rush, increasing spell casting speed. The effect triggers after Flame Shock is applied and features a unique inferno visual. In exchange, Flame Shock's cooldown is tripled.",
  },
  {
    name: "Rune of Blood Magic",
    description:
      "While you know Life Tap, all mana costs are replaced with health costs, allowing you to fuel your magic through Blood Magic rather than mana.",
  },
  {
    name: "Rune of the Thousandfold Frost",
    description:
      "Frostbolt splinters into a barrage that strikes every enemy in front of you. While this rune is active, Frostbolt gains a cooldown.",
  },
  {
    name: "Rune of the Sanguine Blight",
    description:
      "Blood Boil deals additional damage to targets afflicted by your Priest or Warlock Shadow damage-over-time effects and refreshes those effects. Includes a unique Blood Boil visual.",
  },
  {
    name: "Rune of the Raptor Loa's Fury",
    description:
      "Raptor Strike summons spectral feral raptors to fight alongside you for 15 seconds. The rune increases Raptor Strike damage by 200% and adds only 30 seconds to its cooldown. Features upgraded spectral raptor visuals and models.",
  },
  {
    name: "Rune of the Eternal Conduit",
    description:
      "Lightning Shield becomes permanent, no longer loses charges when struck, and continuously discharges lightning into nearby enemies every 3 seconds.",
  },
  {
    name: "Rune of the Flourishing Surging Wave",
    description:
      "Healing Wave critical strikes grant Surging Wave, reducing both the cast time and global cooldown of Healing Wave. Healing Wave also refreshes your healing-over-time effects on the target. Surging Wave includes a dedicated visual effect.",
  },
  {
    name: "Rune of the Archangel",
    description:
      "Grants the Evangelism and Archangel abilities. Smite and Holy Fire generate Evangelism stacks that empower your holy magic, while Archangel consumes those stacks to restore mana and significantly increase healing done.",
  },
  {
    name: "Rune of the Righteous Crusading Storm",
    description:
      "Divine Storm carries the zeal of a crusade, causing a Crusader Strike to be delivered to every enemy hit by Divine Storm.",
  },
  {
    name: "Rune of the Vortex of Imbued Blades",
    description:
      "Bladestorm lasts twice as long and transforms into a vortex of enchanted steel. Enemies struck are randomly afflicted with your damaging spell-over-time effects. Includes a unique Bladestorm visual effect.",
  },
] as const;

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("runicEnhancements")
      .withIndex("by_quality", (q) => q.eq("quality", "legendary"))
      .collect();

    const existingNames = new Set(existing.map((item) => item.name));

    let inserted = 0;
    let skipped = 0;

    for (const rune of LEGENDARY_RUNIC_ENHANCEMENTS) {
      if (existingNames.has(rune.name)) {
        skipped += 1;
        continue;
      }

      await ctx.db.insert("runicEnhancements", {
        quality: "legendary",
        name: rune.name,
        description: rune.description,
        mainAbility: null,
        otherAbilities: [],
      });
      inserted += 1;
    }

    return { inserted, skipped, total: LEGENDARY_RUNIC_ENHANCEMENTS.length };
  },
});
