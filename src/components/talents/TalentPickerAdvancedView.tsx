import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import { TALENT_EFFECT_CATEGORIES } from "@/lib/talentEffectForm";
import {
  loadPersistedTabs,
  persistTabs,
  TALENT_EFFECT_TABS_KEY,
  toggleTalentInSet,
  type EffectViewTab,
} from "@/lib/talentEffectView";
import type { TalentGameItem } from "@/lib/types";
import { fromConvexTalent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TalentEffectTabPicker } from "./TalentEffectTabPicker";
import { TalentEffectViewBuilder } from "./TalentEffectViewBuilder";
import { TalentSelectedStrip } from "./TalentSelectedStrip";

interface TalentPickerAdvancedViewProps {
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  readOnly?: boolean;
  maxSelections?: number;
  collapsibleBuilder?: boolean;
  showSelectedStrip?: boolean;
  className?: string;
}

export function TalentPickerAdvancedView({
  selectedIds,
  onSelectionChange,
  readOnly = false,
  maxSelections = BUILD_SLOTS.talent,
  collapsibleBuilder = false,
  showSelectedStrip = false,
  className,
}: TalentPickerAdvancedViewProps) {
  const { t } = useTranslation();
  const allTalentsRaw = useQuery(api.talents.list, {});
  const allTalents = useMemo(
    () => (allTalentsRaw ?? []).map(fromConvexTalent),
    [allTalentsRaw],
  );

  const [builderCategory, setBuilderCategory] = useState<string>(
    TALENT_EFFECT_CATEGORIES[0],
  );
  const [effectTabs, setEffectTabs] = useState<EffectViewTab[]>(() =>
    loadPersistedTabs(TALENT_EFFECT_TABS_KEY),
  );
  const [builderOpen, setBuilderOpen] = useState(true);

  const talentById = useMemo(
    () => new Map(allTalents.map((talent) => [talent.id, talent])),
    [allTalents],
  );

  const selectedTalents = useMemo(
    () =>
      [...selectedIds]
        .map((id) => talentById.get(id))
        .filter((talent): talent is TalentGameItem => talent !== undefined),
    [selectedIds, talentById],
  );

  const handleTabsChange = useCallback((tabs: EffectViewTab[]) => {
    setEffectTabs(tabs);
    persistTabs(tabs, TALENT_EFFECT_TABS_KEY);
  }, []);

  const handleToggleTalent = useCallback(
    (talent: TalentGameItem) => {
      const next = toggleTalentInSet(
        talent.id,
        selectedIds,
        maxSelections,
        readOnly,
      );
      if (next) onSelectionChange(next);
    },
    [selectedIds, maxSelections, readOnly, onSelectionChange],
  );

  const handleRemoveSelected = useCallback(
    (id: string) => {
      if (readOnly) return;
      const next = new Set(selectedIds);
      next.delete(id);
      onSelectionChange(next);
    },
    [readOnly, selectedIds, onSelectionChange],
  );

  return (
    <div className={cn("talent-picker-advanced", className)}>
      {collapsibleBuilder ? (
        <div className="talent-effect-picker__builder-bar">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs tracking-wide uppercase"
            onClick={() => setBuilderOpen((open) => !open)}
            aria-expanded={builderOpen}
          >
            {builderOpen
              ? t("talents.effectView.hideBuilder")
              : t("talents.effectView.showBuilder")}
          </Button>
          {!builderOpen && effectTabs.length > 0 ? (
            <span className="text-xs text-muted-foreground">
              {t("talents.effectView.tabCount", { count: effectTabs.length })}
            </span>
          ) : null}
        </div>
      ) : null}

      {(!collapsibleBuilder || builderOpen) && (
        <TalentEffectViewBuilder
          persistKey={TALENT_EFFECT_TABS_KEY}
          selectedCategory={builderCategory}
          onSelectedCategoryChange={setBuilderCategory}
          tabs={effectTabs}
          onTabsChange={handleTabsChange}
        />
      )}

      <div className="talent-picker-advanced__tab-picker">
        <TalentEffectTabPicker
          tabs={effectTabs}
          talents={allTalents}
          selectedIds={selectedIds}
          readOnly={readOnly}
          onToggleTalent={handleToggleTalent}
        />
      </div>

      {showSelectedStrip ? (
        <TalentSelectedStrip
          selected={selectedTalents}
          readOnly={readOnly}
          onRemove={handleRemoveSelected}
          className="talent-picker-advanced__selected-strip"
        />
      ) : null}
    </div>
  );
}
