import { useTranslation } from "react-i18next";
import type { AbilityDisplayMode } from "@/lib/abilityDisplayMode";
import { cn } from "@/lib/utils";

interface AbilityDisplayModeToggleProps {
  mode: AbilityDisplayMode;
  onChange: (mode: AbilityDisplayMode) => void;
}

export function AbilityDisplayModeToggle({
  mode,
  onChange,
}: AbilityDisplayModeToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      className="ability-display-mode-toggle"
      role="group"
      aria-label={t("abilities.displayModeLabel")}
    >
      {(["compact", "game"] as const).map((value) => (
        <button
          key={value}
          type="button"
          className={cn(
            "ability-display-mode-toggle__btn",
            mode === value && "ability-display-mode-toggle__btn--active",
          )}
          aria-pressed={mode === value}
          onClick={() => onChange(value)}
        >
          {t(
            value === "compact"
              ? "abilities.displayModeCompact"
              : "abilities.displayModeGame",
          )}
        </button>
      ))}
    </div>
  );
}
