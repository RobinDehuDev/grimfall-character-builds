import { BUILD_SLOTS } from "./buildSlots";
import type { CapstoneGameItem } from "./types";
import {
  displayWotlkClassName,
  isPlayableWotlkClass,
  WOTLK_PLAYABLE_CLASS_ORDER,
} from "./wotlkClasses";
export { talentIconUrl as capstoneIconUrl } from "./talents";

export type CapstoneClassGroup = {
  wotlkClass: string;
  className: string;
  capstones: CapstoneGameItem[];
};

export function groupCapstonesByClass(
  items: CapstoneGameItem[],
): CapstoneClassGroup[] {
  const buckets = new Map<string, CapstoneGameItem[]>();

  for (const capstone of items) {
    if (!isPlayableWotlkClass(capstone.wotlkClass)) continue;
    const list = buckets.get(capstone.wotlkClass) ?? [];
    list.push(capstone);
    buckets.set(capstone.wotlkClass, list);
  }

  return WOTLK_PLAYABLE_CLASS_ORDER.filter((slug) => buckets.has(slug)).map(
    (wotlkClass) => ({
      wotlkClass,
      className: displayWotlkClassName(wotlkClass),
      capstones: [...(buckets.get(wotlkClass) ?? [])].sort((a, b) =>
        a.name.localeCompare(b.name),
      ),
    }),
  );
}

export function slotsToCapstoneIdSet(slots: (string | null)[]): Set<string> {
  return new Set(slots.filter((id): id is string => id !== null));
}

export function capstoneIdSetToSlots(
  ids: ReadonlySet<string>,
): (string | null)[] {
  const filled = [...ids];
  const slots: (string | null)[] = filled.slice(0, BUILD_SLOTS.capstone);
  while (slots.length < BUILD_SLOTS.capstone) slots.push(null);
  return slots;
}
