import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { TalentGridCore } from "@/components/talents/TalentPickerModal";
import {
  TalentSearchPanel,
  type SpellSearchResult,
} from "@/components/talents/TalentSearchPanel";
import { AdminTalentFormModal } from "@/components/admin/AdminTalentFormModal";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { TalentGameItem } from "@/lib/types";
import { fromConvexTalent } from "@/lib/types";
import type { WotlkClassSlug } from "@/lib/talents";

const EMPTY_SET = new Set<string>();

export function AdminTalentsPage() {
  const { t } = useTranslation();
  const convex = useConvex();
  const [sessionKey, setSessionKey] = useState(0);
  const [activeClass, setActiveClass] = useState<WotlkClassSlug>("death-knight");
  const [highlightTalentId, setHighlightTalentId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingItem, setEditingItem] = useState<TalentGameItem | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((talent: TalentGameItem) => {
    setEditingItem(talent);
    setModalOpen(true);
  }, []);

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

  return (
    <>
      <PageHeader
        title={t("admin.manageTalents")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      >
        <AdminShowHiddenToggle
          checked={showHidden}
          onCheckedChange={setShowHidden}
        />
        <Button type="button" onClick={openCreate}>
          {t("admin.addTalent")}
        </Button>
      </PageHeader>

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
