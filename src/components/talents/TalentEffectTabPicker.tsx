import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  EFFECT_COLUMNS,
  groupTalentsForTab,
  tabKey,
  type EffectViewTab,
  type TalentEffectRow,
} from "@/lib/talentEffectView";
import { tabDisplayLabel } from "@/lib/talentEffectForm";
import type { TalentGameItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TalentEffectColumn } from "./TalentEffectColumn";

interface TalentEffectTabPickerProps {
  tabs: EffectViewTab[];
  talents: TalentGameItem[];
  selectedIds?: ReadonlySet<string>;
  readOnly?: boolean;
  onToggleTalent?: (talent: TalentGameItem) => void;
  onTalentClick?: (row: TalentEffectRow) => void;
}

const COLUMN_TITLE_KEYS = {
  flat: "talents.effectView.columnFlat",
  percent: "talents.effectView.columnPercent",
  conditional: "talents.effectView.columnConditional",
} as const;

export function TalentEffectTabPicker({
  tabs,
  talents,
  selectedIds,
  readOnly = false,
  onToggleTalent,
  onTalentClick,
}: TalentEffectTabPickerProps) {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = useState<string | null>(
    tabs.length > 0 ? tabKey(tabs[0]) : null,
  );
  const [invertByTab, setInvertByTab] = useState<Record<string, boolean>>({});

  const resolvedActiveKey = useMemo(() => {
    if (tabs.length === 0) return null;
    if (activeTabKey && tabs.some((tab) => tabKey(tab) === activeTabKey)) {
      return activeTabKey;
    }
    return tabKey(tabs[0]);
  }, [tabs, activeTabKey]);

  const activeTab = tabs.find((tab) => tabKey(tab) === resolvedActiveKey);

  const grouped = useMemo(() => {
    if (!activeTab) return null;
    const invert = invertByTab[tabKey(activeTab)] ?? false;
    return groupTalentsForTab(talents, activeTab, invert);
  }, [activeTab, talents, invertByTab]);

  if (tabs.length === 0) {
    return (
      <p className="talent-effect-picker__empty">
        {t("talents.effectView.noTabsSelected")}
      </p>
    );
  }

  const handleToggleTalent = onToggleTalent
    ? (row: TalentEffectRow) => onToggleTalent(row.talent)
    : undefined;

  const toggleInvert = (key: string, checked: boolean) => {
    setInvertByTab((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <section className="talent-effect-picker">
      <div className="talent-effect-picker__tabs" role="tablist">
        {tabs.map((tab) => {
          const key = tabKey(tab);
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={key === resolvedActiveKey}
              className={cn(
                "talent-effect-picker__tab",
                key === resolvedActiveKey && "talent-effect-picker__tab--active",
              )}
              onClick={() => setActiveTabKey(key)}
            >
              {tabDisplayLabel(tab)}
            </button>
          );
        })}
      </div>

      {activeTab && grouped ? (
        <>
          <div className="talent-effect-picker__toolbar">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`invert-${resolvedActiveKey}`}
                checked={invertByTab[resolvedActiveKey!] ?? false}
                onCheckedChange={(value) =>
                  toggleInvert(resolvedActiveKey!, value === true)
                }
              />
              <Label htmlFor={`invert-${resolvedActiveKey}`}>
                {t("talents.effectView.invertSort")}
              </Label>
            </div>
          </div>

          <div className="talent-effect-picker__columns">
            {EFFECT_COLUMNS.map((column) => (
              <TalentEffectColumn
                key={column}
                title={t(COLUMN_TITLE_KEYS[column])}
                rows={grouped[column]}
                selectedIds={selectedIds}
                readOnly={readOnly}
                onTalentClick={onTalentClick}
                onToggleTalent={handleToggleTalent}
              />
            ))}
          </div>
        </>
      ) : null}
    </section>
  );
}
