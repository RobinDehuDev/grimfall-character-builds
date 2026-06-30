import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { AbilityGridCore } from "@/components/abilities/AbilityPickerModal";
import { AbilityDisplayModeToggle } from "@/components/abilities/AbilityDisplayModeToggle";
import { AbilitySearchPanel } from "@/components/abilities/AbilitySearchPanel";
import { AdminAbilityFormModal } from "@/components/admin/AdminAbilityFormModal";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { AbilityClassSlug } from "@/lib/wotlkClasses";
import { normalizeAbilityWotlkClass } from "@/lib/wotlkClasses";
import { useAbilityDisplayMode } from "@/lib/abilityDisplayMode";
import type { AbilityGameItem } from "@/lib/types";
import { fromConvexAbility } from "@/lib/types";
import type { SpellSearchResult } from "@/components/talents/TalentSearchPanel";

const EMPTY_SET = new Set<string>();

export function AdminAbilitiesPage() {
  const { t } = useTranslation();
  const convex = useConvex();
  const { displayMode, setDisplayMode } = useAbilityDisplayMode();
  const [sessionKey, setSessionKey] = useState(0);
  const [activeClass, setActiveClass] = useState<AbilityClassSlug>("death-knight");
  const [highlightAbilityId, setHighlightAbilityId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingItem, setEditingItem] = useState<AbilityGameItem | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((ability: AbilityGameItem) => {
    setEditingItem(ability);
    setModalOpen(true);
  }, []);

  const handleEditFromGrid = useCallback(
    async (ability: AbilityGameItem) => {
      const doc = await convex.query(api.abilities.get, {
        id: ability.id as Id<"abilities">,
      });
      if (doc) openEdit(fromConvexAbility(doc));
    },
    [convex, openEdit],
  );

  const handleFindAbility = (result: SpellSearchResult) => {
    setActiveClass(
      normalizeAbilityWotlkClass(result.wotlkClass) as AbilityClassSlug,
    );
    setHighlightAbilityId(result._id);
    window.setTimeout(() => setHighlightAbilityId(null), 2500);
  };

  const handleEditFromSearch = useCallback(
    async (result: SpellSearchResult) => {
      const doc = await convex.query(api.abilities.get, {
        id: result._id as Id<"abilities">,
      });
      if (doc) openEdit(fromConvexAbility(doc));
    },
    [convex, openEdit],
  );

  const handleSaved = () => {
    setSessionKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader
        title={t("admin.manageAbilities")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
        className="items-center"
      >
        <AbilityDisplayModeToggle
          mode={displayMode}
          onChange={setDisplayMode}
        />
        <AdminShowHiddenToggle
          checked={showHidden}
          onCheckedChange={setShowHidden}
        />
        <Button type="button" onClick={openCreate}>
          {t("admin.addAbility")}
        </Button>
      </PageHeader>

      <div className="talent-modal-layout ability-modal-layout">
        <div className="talent-modal-layout__grid ability-modal-layout__grid">
          <AbilityGridCore
            key={sessionKey}
            sessionKey={sessionKey}
            selectedIds={EMPTY_SET}
            onSelectionChange={() => {}}
            showSelectedStrip={false}
            activeClass={activeClass}
            onActiveClassChange={setActiveClass}
            highlightAbilityId={highlightAbilityId}
            onItemClick={handleEditFromGrid}
            includeHiddenItems={showHidden}
            displayMode={displayMode}
          />
        </div>
        <AbilitySearchPanel
          selectedIds={EMPTY_SET}
          onFindAbility={handleFindAbility}
          onAddAbility={() => {}}
          onEditItem={handleEditFromSearch}
          includeHiddenItems={showHidden}
        />
      </div>

      <AdminAbilityFormModal
        key={editingItem?.id ?? "create"}
        open={modalOpen}
        item={editingItem}
        defaultWotlkClass={activeClass}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
