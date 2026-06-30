import { useTranslation } from "react-i18next";
import { TalentIcon } from "@/components/talents/TalentIcon";
import type { TalentEffectRow } from "@/lib/talentEffectView";
import { formatEffectValue } from "@/lib/talentEffectView";
import { displayWotlkClassName } from "@/lib/wotlkClasses";
import { schoolLabel } from "@/lib/talentEffectForm";
import { cn } from "@/lib/utils";

interface TalentEffectColumnProps {
  title: string;
  rows: TalentEffectRow[];
  selectedIds?: ReadonlySet<string>;
  readOnly?: boolean;
  onTalentClick?: (row: TalentEffectRow) => void;
  onToggleTalent?: (row: TalentEffectRow) => void;
}

export function TalentEffectColumn({
  title,
  rows,
  selectedIds,
  readOnly = false,
  onTalentClick,
  onToggleTalent,
}: TalentEffectColumnProps) {
  const { t } = useTranslation();

  const handleRowClick = (row: TalentEffectRow) => {
    if (onTalentClick) {
      onTalentClick(row);
      return;
    }
    if (onToggleTalent && !readOnly) {
      onToggleTalent(row);
    }
  };

  return (
    <div className="talent-effect-picker__column">
      <h3 className="talent-effect-picker__column-title">{title}</h3>
      <div className="talent-effect-picker__column-list">
        {rows.length === 0 ? (
          <p className="talent-effect-picker__column-empty">
            {t("talents.effectView.noTalentsInColumn")}
          </p>
        ) : (
          rows.map(({ talent, effect }) => {
            const selected = selectedIds?.has(talent.id) ?? false;
            const interactive = Boolean(onTalentClick || (onToggleTalent && !readOnly));
            return (
              <div
                key={`${talent.id}-${effect.stat}-${effect.typeOfEffect}`}
                className={cn(
                  "talent-effect-picker__row",
                  selected && "talent-effect-picker__row--selected",
                  interactive && "talent-effect-picker__row--interactive",
                )}
              >
                <TalentIcon
                  talent={talent}
                  selected={selected}
                  readOnly={readOnly || !interactive}
                  onItemClick={() => handleRowClick({ talent, effect })}
                />
                <button
                  type="button"
                  className="talent-effect-picker__meta"
                  disabled={!interactive}
                  onClick={() => handleRowClick({ talent, effect })}
                >
                  <span className="talent-effect-picker__name">{talent.name}</span>
                  <span className="talent-effect-picker__class">
                    {displayWotlkClassName(talent.wotlkClass)}
                  </span>
                  <span className="talent-effect-picker__value">
                    {formatEffectValue(effect)}
                    {effect.scope?.school ? (
                      <span className="talent-effect-picker__school">
                        {" "}
                        · {schoolLabel(effect.scope.school)}
                      </span>
                    ) : null}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
