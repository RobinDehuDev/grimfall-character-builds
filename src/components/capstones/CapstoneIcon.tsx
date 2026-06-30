import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { CapstoneGameItem } from "@/lib/types";
import { capstoneIconUrl } from "@/lib/capstones";

interface CapstoneIconProps {
  capstone: CapstoneGameItem;
  selected: boolean;
  highlighted?: boolean;
  readOnly?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}

export function CapstoneIcon({
  capstone,
  selected,
  highlighted = false,
  readOnly = false,
  onToggle,
  onItemClick,
}: CapstoneIconProps) {
  const { t } = useTranslation();
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
        data-capstone-id={capstone.id}
        className={cn(
          "talent-icon capstone-icon",
          selected && "talent-icon--selected",
          highlighted && "talent-icon--highlighted",
          readOnly && "talent-icon--readonly",
          capstone.hidden && "talent-icon--hidden",
        )}
        disabled={readOnly && !onItemClick}
        onClick={() => (onItemClick ? onItemClick() : onToggle?.())}
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
        aria-label={capstone.name}
      >
        {capstone.icon ? (
          <img
            src={capstoneIconUrl(capstone.icon)}
            alt=""
            className="talent-icon__img"
            loading="lazy"
            width={36}
            height={36}
          />
        ) : (
          <span className="ability-icon__fallback" aria-hidden>
            ?
          </span>
        )}
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
            <p className="talent-tooltip__name">{capstone.name}</p>
            {capstone.hidden && (
              <p className="talent-tooltip__level">{t("admin.hiddenItemBadge")}</p>
            )}
            {capstone.description && (
              <p className="talent-tooltip__desc">{capstone.description}</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
