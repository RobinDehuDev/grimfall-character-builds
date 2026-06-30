import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { AbilityGameItem } from "@/lib/types";
import { abilityIconUrl } from "@/lib/abilities";

interface AbilityIconProps {
  ability: AbilityGameItem;
  selected: boolean;
  highlighted?: boolean;
  readOnly?: boolean;
  showWowheadHighlight?: boolean;
  showAdminHighlights?: boolean;
  onToggle?: () => void;
  onItemClick?: () => void;
}

export function AbilityIcon({
  ability,
  selected,
  highlighted = false,
  readOnly = false,
  showWowheadHighlight = false,
  showAdminHighlights = false,
  onToggle,
  onItemClick,
}: AbilityIconProps) {
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
        data-ability-id={ability.id}
        className={cn(
          "talent-icon ability-icon",
          selected && "talent-icon--selected",
          highlighted && "talent-icon--highlighted",
          readOnly && "talent-icon--readonly",
          ability.hidden && "talent-icon--hidden",
          showWowheadHighlight &&
            ability.addedFromWowhead &&
            "talent-icon--wowhead",
          showAdminHighlights &&
            ability.probablyTalent &&
            "talent-icon--probably-talent",
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
        aria-label={ability.name}
      >
        {ability.icon ? (
          <img
            src={abilityIconUrl(ability.icon)}
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
            <p className="talent-tooltip__name">{ability.name}</p>
            {ability.hidden && (
              <p className="talent-tooltip__level">{t("admin.hiddenItemBadge")}</p>
            )}
            {ability.addedFromWowhead && (
              <p className="talent-tooltip__level">{t("admin.addedFromWowhead")}</p>
            )}
            {ability.probablyTalent && (
              <p className="talent-tooltip__level">{t("admin.probablyTalent")}</p>
            )}
            {ability.levelRequirement > 0 && (
              <p className="talent-tooltip__level">
                {t("common.requiresLevel", { level: ability.levelRequirement })}
              </p>
            )}
            {ability.description && (
              <p className="talent-tooltip__desc">{ability.description}</p>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
