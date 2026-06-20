import type { SlotCategory } from "./categories";
import { getItemSlotCategory } from "./types";
import type { GameItem } from "./types";

export function itemBorderColor(item: GameItem | SlotCategory): string {
  const category = typeof item === "string" ? item : getItemSlotCategory(item);
  const map: Record<SlotCategory, string> = {
    talent: "var(--quality-uncommon)",
    ability: "var(--quality-rare)",
    capstone: "var(--quality-legendary)",
    uncommon_re: "var(--quality-uncommon)",
    rare_re: "var(--quality-rare)",
    epic_re: "var(--quality-epic)",
    legendary_re: "var(--quality-legendary)",
  };
  return map[category];
}
