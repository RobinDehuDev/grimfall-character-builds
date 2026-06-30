import { useState } from "react";

export type AbilityDisplayMode = "compact" | "game";

const STORAGE_KEY = "ability-picker-display-mode";

export function loadAbilityDisplayMode(): AbilityDisplayMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "compact" || value === "game") return value;
  } catch {
    /* ignore */
  }
  return "compact";
}

export function saveAbilityDisplayMode(mode: AbilityDisplayMode) {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function useAbilityDisplayMode() {
  const [displayMode, setDisplayModeState] = useState<AbilityDisplayMode>(
    loadAbilityDisplayMode,
  );

  const setDisplayMode = (mode: AbilityDisplayMode) => {
    setDisplayModeState(mode);
    saveAbilityDisplayMode(mode);
  };

  return { displayMode, setDisplayMode };
}
