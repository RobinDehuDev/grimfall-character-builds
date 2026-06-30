import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TalentGameItem } from "@/lib/types";
import type { TalentTooltipPlacement } from "./useTalentHoverTooltip";

interface TalentTooltipProps {
  talent: TalentGameItem;
  show: boolean;
  x: number;
  y: number;
  width: number;
  placement?: TalentTooltipPlacement;
}

export function TalentTooltip({
  talent,
  show,
  x,
  y,
  width,
  placement = "below",
}: TalentTooltipProps) {
  const { t } = useTranslation();

  if (!show) return null;

  return createPortal(
    <div
      className={cn(
        "talent-tooltip",
        placement === "above" && "talent-tooltip--above",
      )}
      style={{
        left: x,
        top: y,
        width,
        transform: placement === "above" ? "translateY(-100%)" : undefined,
      }}
      role="tooltip"
    >
      <p className="talent-tooltip__name">{talent.name}</p>
      {talent.hidden && (
        <p className="talent-tooltip__level">{t("admin.hiddenItemBadge")}</p>
      )}
      {talent.description && (
        <p className="talent-tooltip__desc">{talent.description}</p>
      )}
    </div>,
    document.body,
  );
}
