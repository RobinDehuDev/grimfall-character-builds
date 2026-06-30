import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvex, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TalentGridCore } from "@/components/talents/TalentPickerModal";
import {
  TalentSearchPanel,
  type SpellSearchResult,
} from "@/components/talents/TalentSearchPanel";
import { AdminTalentFormModal } from "@/components/admin/AdminTalentFormModal";
import { TalentEffectTabPicker } from "@/components/talents/TalentEffectTabPicker";
import { TalentEffectViewBuilder } from "@/components/talents/TalentEffectViewBuilder";
import { TalentPickerViewToggle } from "@/components/talents/TalentPickerViewToggle";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { TalentGameItem } from "@/lib/types";
import { fromConvexTalent } from "@/lib/types";
import type { WotlkClassSlug } from "@/lib/talents";
import {
  ADMIN_TALENT_EFFECT_TABS_KEY,
  loadPersistedTabs,
  persistTabs,
  type EffectViewTab,
} from "@/lib/talentEffectView";
import { TALENT_EFFECT_CATEGORIES } from "@/lib/talentEffectForm";

const EMPTY_SET = new Set<string>();

type AdminTalentViewMode = "grid" | "advanced";

export function AdminTalentsPage() {
  const { t } = useTranslation();
  const convex = useConvex();
  const [sessionKey, setSessionKey] = useState(0);
  const [viewMode, setViewMode] = useState<AdminTalentViewMode>("grid");
  const [activeClass, setActiveClass] = useState<WotlkClassSlug>("death-knight");
  const [highlightTalentId, setHighlightTalentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingItem, setEditingItem] = useState<TalentGameItem | null>(null);
  const [builderCategory, setBuilderCategory] = useState<string>(
    TALENT_EFFECT_CATEGORIES[0],
  );
  const [effectTabs, setEffectTabs] = useState<EffectViewTab[]>(() =>
    loadPersistedTabs(ADMIN_TALENT_EFFECT_TABS_KEY),
  );

  const allTalentsRaw = useQuery(
    api.talents.list,
    viewMode === "advanced" ? { includeHiddenItems: showHidden } : "skip",
  );
  const allTalents = useMemo(
    () => (allTalentsRaw ?? []).map(fromConvexTalent),
    [allTalentsRaw],
  );

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((talent: TalentGameItem) => {
    void (async () => {
      const doc = await convex.query(api.talents.get, {
        id: talent.id as Id<"talents">,
      });
      if (doc) setEditingItem(fromConvexTalent(doc));
      else setEditingItem(talent);
      setModalOpen(true);
    })();
  }, [convex]);

  const handleFindTalent = (result: SpellSearchResult) => {
    if (!result.wotlkClass) return;
    setActiveClass(result.wotlkClass as WotlkClassSlug);
    setHighlightTalentId(result._id);
    window.setTimeout(() => setHighlightTalentId(null), 2500);
  };

  const handleEditFromSearch = useCallback(
    async (result: SpellSearchResult) => {
      const doc = await convex.query(api.talents.get, {
        id: result._id as Id<"talents">,
      });
      if (doc) openEdit(fromConvexTalent(doc));
    },
    [convex, openEdit],
  );

  const handleSaved = () => {
    setSessionKey((k) => k + 1);
  };

  const handleTabsChange = (tabs: EffectViewTab[]) => {
    setEffectTabs(tabs);
    persistTabs(tabs, ADMIN_TALENT_EFFECT_TABS_KEY);
  };

  return (
    <>
      <PageHeader
        title={t(
          viewMode === "advanced"
            ? "admin.manageTalentsExperimental"
            : "admin.manageTalents",
        )}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      >
        <TalentPickerViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />
        <AdminShowHiddenToggle
          checked={showHidden}
          onCheckedChange={setShowHidden}
        />
        <Button type="button" onClick={openCreate}>
          {t("admin.addTalent")}
        </Button>
      </PageHeader>

      {viewMode === "grid" ? (
        <div className="talent-modal-layout">
          <div className="talent-modal-layout__grid">
            <TalentGridCore
              key={sessionKey}
              sessionKey={sessionKey}
              selectedIds={EMPTY_SET}
              onSelectionChange={() => {}}
              showSelectedStrip={false}
              activeClass={activeClass}
              onActiveClassChange={setActiveClass}
              highlightTalentId={highlightTalentId}
              onItemClick={openEdit}
              includeHiddenItems={showHidden}
            />
          </div>
          <TalentSearchPanel
            selectedIds={EMPTY_SET}
            onFindTalent={handleFindTalent}
            onAddTalent={() => {}}
            onEditItem={handleEditFromSearch}
            includeHiddenItems={showHidden}
          />
        </div>
      ) : (
        <div className="talent-picker-advanced">
          <TalentEffectViewBuilder
            persistKey={ADMIN_TALENT_EFFECT_TABS_KEY}
            selectedCategory={builderCategory}
            onSelectedCategoryChange={setBuilderCategory}
            tabs={effectTabs}
            onTabsChange={handleTabsChange}
          />
          <div className="talent-modal-layout talent-picker-advanced__main">
            <div className="talent-modal-layout__grid">
              <TalentEffectTabPicker
                tabs={effectTabs}
                talents={allTalents}
                onTalentClick={(row) => openEdit(row.talent)}
              />
            </div>
            <TalentSearchPanel
              selectedIds={EMPTY_SET}
              onFindTalent={(result) => {
                setViewMode("grid");
                handleFindTalent(result);
              }}
              onAddTalent={() => {}}
              onEditItem={handleEditFromSearch}
              includeHiddenItems={showHidden}
            />
          </div>
        </div>
      )}

      <AdminTalentFormModal
        open={modalOpen}
        item={editingItem}
        defaultWotlkClass={activeClass}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
