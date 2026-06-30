import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { TalentGameItem } from "@/lib/types";
import { talentIconUrl } from "@/lib/talents";
import { TalentTooltip } from "./TalentTooltip";
import { useTalentHoverTooltip } from "./useTalentHoverTooltip";

interface TalentSelectedIconProps {
  talent: TalentGameItem;
  readOnly?: boolean;
  onRemove?: () => void;
}

export function TalentSelectedIcon({
  talent,
  readOnly = false,
  onRemove,
}: TalentSelectedIconProps) {
  const { t } = useTranslation();
  const {
    btnRef,
    showTip,
    tipPos,
    tipWidth,
    showTooltip,
    hideTooltip,
    placement,
  } = useTalentHoverTooltip("above");

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-talent-id={talent.id}
        className={cn(
          "talent-icon talent-icon--selected talent-selected-strip__icon",
          readOnly && "talent-icon--readonly",
          talent.hidden && "talent-icon--hidden",
        )}
        disabled={readOnly}
        onClick={() => {
          if (!readOnly) onRemove?.();
        }}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-label={
          readOnly ? talent.name : `${talent.name} — ${t("talents.clickToRemove")}`
        }
      >
        <img
          src={talentIconUrl(talent.icon)}
          alt=""
          className="talent-icon__img"
          loading="lazy"
          width={36}
          height={36}
        />
      </button>

      <TalentTooltip
        talent={talent}
        show={showTip}
        x={tipPos.x}
        y={tipPos.y}
        width={tipWidth}
        placement={placement}
      />
    </>
  );
}
