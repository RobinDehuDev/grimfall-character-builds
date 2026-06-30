import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalentGameItem } from "@/lib/types";
import { talentIconUrl } from "@/lib/talents";
import { TalentTooltip } from "./TalentTooltip";
import { useTalentHoverTooltip } from "./useTalentHoverTooltip";

interface TalentIconProps {
  talent: TalentGameItem;
  selected: boolean;
  highlighted?: boolean;
  readOnly?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}

export function TalentIcon({
  talent,
  selected,
  highlighted = false,
  readOnly = false,
  onToggle,
  onItemClick,
}: TalentIconProps) {
  const {
    btnRef,
    showTip,
    tipPos,
    tipWidth,
    showTooltip,
    hideTooltip,
    placement,
  } = useTalentHoverTooltip("below");

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        data-talent-id={talent.id}
        className={cn(
          "talent-icon",
          selected && "talent-icon--selected",
          highlighted && "talent-icon--highlighted",
          readOnly && "talent-icon--readonly",
          talent.hidden && "talent-icon--hidden",
        )}
        style={{
          gridRow: talent.row,
          gridColumn: talent.col,
        }}
        disabled={readOnly && !onItemClick}
        onClick={() => (onItemClick ? onItemClick() : onToggle?.())}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        aria-pressed={selected}
        aria-label={talent.name}
      >
        <img
          src={talentIconUrl(talent.icon)}
          alt=""
          className="talent-icon__img"
          loading="lazy"
          width={36}
          height={36}
        />
        {selected && (
          <span className="talent-icon__check" aria-hidden>
            <Check className="size-3" strokeWidth={3} />
          </span>
        )}
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
