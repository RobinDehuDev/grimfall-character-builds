import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export type TalentPickerViewMode = "grid" | "advanced";

interface TalentPickerViewToggleProps {
  viewMode: TalentPickerViewMode;
  onViewModeChange: (mode: TalentPickerViewMode) => void;
}

export function TalentPickerViewToggle({
  viewMode,
  onViewModeChange,
}: TalentPickerViewToggleProps) {
  const { t } = useTranslation();

  return (
    <div
      className="talent-picker-view-toggle"
      role="group"
      aria-label={t("talents.viewMode")}
    >
      <Button
        type="button"
        size="sm"
        variant={viewMode === "grid" ? "default" : "outline"}
        onClick={() => onViewModeChange("grid")}
      >
        {t("talents.viewGrid")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={viewMode === "advanced" ? "default" : "outline"}
        onClick={() => onViewModeChange("advanced")}
      >
        {t("talents.viewAdvanced")}
      </Button>
    </div>
  );
}
