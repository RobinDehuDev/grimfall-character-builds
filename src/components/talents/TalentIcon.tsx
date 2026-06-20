import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TalentGameItem } from "@/lib/types";
import { talentIconUrl } from "@/lib/talents";

interface TalentIconProps {
  talent: TalentGameItem;
  selected: boolean;
  highlighted?: boolean;
  readOnly?: boolean;
  onToggle?: () => void;
}

export function TalentIcon({
  talent,
  selected,
  highlighted = false,
  readOnly = false,
  onToggle,
}: TalentIconProps) {
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const updateTipPosition = () => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tipWidth = 280;
    let x = rect.left + rect.width / 2 - tipWidth / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - tipWidth - 8));
    setTipPos({ x, y: rect.bottom + 8 });
  };

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
        )}
        style={{
          gridRow: talent.row,
          gridColumn: talent.col,
        }}
        disabled={readOnly}
        onClick={() => onToggle?.()}
        onMouseEnter={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onBlur={() => setShowTip(false)}
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

      {showTip &&
        createPortal(
          <div
            className="talent-tooltip"
            style={{ left: tipPos.x, top: tipPos.y, width: 280 }}
            role="tooltip"
          >
            <p className="talent-tooltip__name">{talent.name}</p>
            {talent.description && (
              <p className="talent-tooltip__desc">{talent.description}</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
