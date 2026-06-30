import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TalentGameItem } from "@/lib/types";
import { TalentSelectedIcon } from "./TalentSelectedIcon";

interface TalentSelectedStripProps {
  selected: TalentGameItem[];
  readOnly?: boolean;
  onRemove?: (id: string) => void;
  className?: string;
}

export function TalentSelectedStrip({
  selected,
  readOnly = false,
  onRemove,
  className,
}: TalentSelectedStripProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "talent-selected-strip",
        selected.length === 0 && "talent-selected-strip--empty",
        className,
      )}
    >
      <span className="talent-selected-strip__label">{t("talents.selected")}</span>
      <div className="talent-selected-strip__items">
        {selected.map((talent) => (
          <TalentSelectedIcon
            key={talent.id}
            talent={talent}
            readOnly={readOnly || !onRemove}
            onRemove={onRemove ? () => onRemove(talent.id) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
