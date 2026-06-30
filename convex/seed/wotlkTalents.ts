import { internalMutation } from "../_generated/server";
import type { TalentEffect } from "../lib/talentEffect";
import { computeItemTags } from "../lib/tags";
import talentData from "./data/wotlk-talents.json";
import effectData from "./data/talent-effects.json";

type TalentRow = (typeof talentData.talents)[number];

type EffectSeedFile = {
  effectsByExternalId: Record<string, TalentEffect[]>;
};

const { effectsByExternalId } = effectData as EffectSeedFile;

function talentKey(t: Pick<TalentRow, "externalId" | "wotlkClass" | "treeIndex" | "row" | "col">) {
  return t.externalId ?? `${t.wotlkClass}:${t.treeIndex}:${t.row}:${t.col}`;
}

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existingTalents = await ctx.db.query("talents").collect();

    const existingByKey = new Map<string, (typeof existingTalents)[number]>();
    for (const item of existingTalents) {
      const key = item.externalId ?? `${item.wotlkClass}:${item.treeIndex}:${item.row}:${item.col}`;
      existingByKey.set(key, item);
    }

    const incomingTalentKeys = new Set<string>();
    let talentsInserted = 0;
    let talentsUpdated = 0;

    const classNameBySlug = new Map(
      talentData.classes.map((c) => [c.wotlkClass, c.name]),
    );

    for (const talent of talentData.talents) {
      const key = talentKey(talent);
      incomingTalentKeys.add(key);
      const className = classNameBySlug.get(talent.wotlkClass);
      const doc = {
        name: talent.name,
        description: talent.description,
        levelRequirement: 0,
        wotlkClass: talent.wotlkClass,
        treeIndex: talent.treeIndex,
        treeName: talent.treeName,
        row: talent.row,
        col: talent.col,
        icon: talent.icon,
        externalId: talent.externalId,
        tags: computeItemTags({
          name: talent.name,
          description: talent.description,
          wotlkClass: talent.wotlkClass,
          className,
          treeName: talent.treeName,
          kind: "talent",
        }),
        ...(talent.externalId && effectsByExternalId[talent.externalId]
          ? { effects: effectsByExternalId[talent.externalId] }
          : {}),
      };

      const existing = existingByKey.get(key);
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        talentsUpdated += 1;
      } else {
        await ctx.db.insert("talents", doc);
        talentsInserted += 1;
      }
    }

    let talentsRemoved = 0;
    for (const item of existingTalents) {
      const key = item.externalId ?? `${item.wotlkClass}:${item.treeIndex}:${item.row}:${item.col}`;
      if (!incomingTalentKeys.has(key)) {
        await ctx.db.delete(item._id);
        talentsRemoved += 1;
      }
    }

    const existingCapstones = await ctx.db.query("capstones").collect();

    const capstoneByKey = new Map<string, (typeof existingCapstones)[number]>();
    for (const item of existingCapstones) {
      if (!item.externalId) continue;
      capstoneByKey.set(item.externalId, item);
    }

    const incomingCapstoneExternalIds = new Set(
      talentData.capstones.map((c) => c.externalId),
    );
    let capstonesInserted = 0;
    let capstonesUpdated = 0;

    for (const capstone of talentData.capstones) {
      const className = classNameBySlug.get(capstone.wotlkClass);
      const doc = {
        name: capstone.name,
        description: capstone.description,
        wotlkClass: capstone.wotlkClass,
        externalId: capstone.externalId,
        icon: capstone.icon,
        tags: computeItemTags({
          name: capstone.name,
          description: capstone.description,
          wotlkClass: capstone.wotlkClass,
          className,
          treeName: capstone.treeName,
          kind: "capstone",
        }),
      };

      const existing = capstoneByKey.get(capstone.externalId);
      if (existing) {
        await ctx.db.patch(existing._id, doc);
        capstonesUpdated += 1;
      } else {
        await ctx.db.insert("capstones", doc);
        capstonesInserted += 1;
      }
    }

    let capstonesRemoved = 0;
    for (const item of existingCapstones) {
      if (!item.externalId) continue;
      if (!incomingCapstoneExternalIds.has(item.externalId)) {
        await ctx.db.delete(item._id);
        capstonesRemoved += 1;
      }
    }

    return {
      talentsInserted,
      talentsUpdated,
      talentsRemoved,
      totalTalents: talentData.talents.length,
      capstonesInserted,
      capstonesUpdated,
      capstonesRemoved,
      totalCapstones: talentData.capstones.length,
    };
  },
});
