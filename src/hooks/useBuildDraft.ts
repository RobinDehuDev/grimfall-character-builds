import { useCallback, useEffect, useState } from "react";
import { emptyBuildSlots, BUILD_SLOTS, type BuildSlots } from "../lib/buildSlots";
import { CATEGORIES } from "../lib/categories";
import type { Id } from "../../convex/_generated/dataModel";

const DRAFT_KEY = "grimfall-build-draft";
/** Bump when slot ID tables or draft shape changes. */
const DRAFT_VERSION = 2;

export interface BuildDraft {
  version?: number;
  title: string;
  description: string;
  isPublic: boolean;
  slots: BuildSlots;
}

function loadDraft(): BuildDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as BuildDraft & { classId?: string };
    if (draft.version !== DRAFT_VERSION) {
      return {
        version: DRAFT_VERSION,
        title: draft.title ?? "",
        description: draft.description ?? "",
        isPublic: draft.isPublic ?? true,
        slots: emptyBuildSlots(),
      };
    }
    return draft;
  } catch {
    return null;
  }
}

export function useBuildDraft() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [slots, setSlots] = useState<BuildSlots>(emptyBuildSlots);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setTitle(draft.title);
      setDescription(draft.description);
      setIsPublic(draft.isPublic);
      setSlots(draft.slots);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const draft: BuildDraft = {
      version: DRAFT_VERSION,
      title,
      description,
      isPublic,
      slots,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [title, description, isPublic, slots, hydrated]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setDescription("");
    setIsPublic(true);
    setSlots(emptyBuildSlots());
  }, []);

  const loadFromBuild = useCallback(
    (data: {
      title: string;
      description?: string;
      isPublic: boolean;
      talents: Id<"talents">[];
      abilities: Id<"abilities">[];
      capstone: Id<"capstones">[];
      uncommonRes: Id<"runicEnhancements">[];
      rareRes: Id<"runicEnhancements">[];
      epicRes: Id<"talents">[];
      legendaryRes: Id<"runicEnhancements">[];
    }) => {
      setTitle(data.title);
      setDescription(data.description ?? "");
      setIsPublic(data.isPublic);
      setSlots({
        talent: padSlots(data.talents, "talent"),
        ability: padSlots(data.abilities, "ability"),
        capstone: padSlots(data.capstone, "capstone"),
        uncommon_re: padSlots(data.uncommonRes, "uncommon_re"),
        rare_re: padSlots(data.rareRes, "rare_re"),
        epic_re: padSlots(data.epicRes, "epic_re"),
        legendary_re: padSlots(data.legendaryRes, "legendary_re"),
      });
    },
    [],
  );

  return {
    title,
    setTitle,
    description,
    setDescription,
    isPublic,
    setIsPublic,
    slots,
    setSlots,
    clearDraft,
    loadFromBuild,
    hydrated,
  };
}

function padSlots(ids: string[], category: keyof BuildSlots): (string | null)[] {
  const max = BUILD_SLOTS[category];
  const slots: (string | null)[] = ids.slice(0, max).map((id) => id as string);
  while (slots.length < max) slots.push(null);
  return slots;
}

export function getDraft(): BuildDraft | null {
  return loadDraft();
}

export function stripUnresolvedSlotIds(
  slots: BuildSlots,
  resolvedIds: ReadonlySet<string>,
): BuildSlots {
  let changed = false;
  const next = { ...slots } as BuildSlots;

  for (const { key } of CATEGORIES) {
    let categoryChanged = false;
    const updated = slots[key].map((id) => {
      if (id && !resolvedIds.has(id)) {
        categoryChanged = true;
        return null;
      }
      return id;
    });
    if (categoryChanged) {
      changed = true;
      next[key] = updated;
    }
  }

  return changed ? next : slots;
}

export function slotsToConvexIds(slots: BuildSlots) {
  const pickTalents = (): Id<"talents">[] =>
    slots.talent.filter((id): id is string => id !== null) as Id<"talents">[];
  const pickEpicTalents = (): Id<"talents">[] =>
    slots.epic_re.filter((id): id is string => id !== null) as Id<"talents">[];
  const pickAbilities = (): Id<"abilities">[] =>
    slots.ability.filter((id): id is string => id !== null) as Id<"abilities">[];
  const pickCapstones = (): Id<"capstones">[] =>
    slots.capstone.filter((id): id is string => id !== null) as Id<"capstones">[];
  const pickRunics = (
    cat: "uncommon_re" | "rare_re" | "legendary_re",
  ): Id<"runicEnhancements">[] =>
    slots[cat].filter((id): id is string => id !== null) as Id<"runicEnhancements">[];

  return {
    talents: pickTalents(),
    abilities: pickAbilities(),
    capstone: pickCapstones(),
    uncommonRes: pickRunics("uncommon_re"),
    rareRes: pickRunics("rare_re"),
    epicRes: pickEpicTalents(),
    legendaryRes: pickRunics("legendary_re"),
  };
}

export function isBuildComplete(slots: BuildSlots): boolean {
  return (Object.keys(slots) as (keyof BuildSlots)[]).every(
    (key) => slots[key].every((s) => s !== null),
  );
}
