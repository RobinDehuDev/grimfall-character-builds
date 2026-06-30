import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useConvex } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CapstoneGridCore } from "@/components/capstones/CapstoneGridCore";
import { CapstoneSearchPanel } from "@/components/capstones/CapstoneSearchPanel";
import { AdminCapstoneFormModal } from "@/components/admin/AdminCapstoneFormModal";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import type { CapstoneGameItem } from "@/lib/types";
import { fromConvexCapstone } from "@/lib/types";
import type { SpellSearchResult } from "@/components/talents/TalentSearchPanel";

const EMPTY_SET = new Set<string>();

export function AdminCapstonesPage() {
  const { t } = useTranslation();
  const convex = useConvex();
  const [sessionKey, setSessionKey] = useState(0);
  const [highlightCapstoneId, setHighlightCapstoneId] = useState<string | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [editingItem, setEditingItem] = useState<CapstoneGameItem | null>(null);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = useCallback((item: CapstoneGameItem) => {
    setEditingItem(item);
    setModalOpen(true);
  }, []);

  const handleEditFromGrid = useCallback(
    async (capstone: CapstoneGameItem) => {
      const doc = await convex.query(api.capstones.get, {
        id: capstone.id as Id<"capstones">,
      });
      if (doc) openEdit(fromConvexCapstone(doc));
    },
    [convex, openEdit],
  );

  const handleFindCapstone = (result: SpellSearchResult) => {
    setHighlightCapstoneId(result._id);
    window.setTimeout(() => setHighlightCapstoneId(null), 2500);
  };

  const handleEditFromSearch = useCallback(
    async (result: SpellSearchResult) => {
      const doc = await convex.query(api.capstones.get, {
        id: result._id as Id<"capstones">,
      });
      if (doc) openEdit(fromConvexCapstone(doc));
    },
    [convex, openEdit],
  );

  const handleSaved = () => {
    setSessionKey((k) => k + 1);
  };

  return (
    <>
      <PageHeader
        title={t("admin.manageCapstones")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      >
        <AdminShowHiddenToggle
          checked={showHidden}
          onCheckedChange={setShowHidden}
        />
        <Button type="button" onClick={openCreate}>
          {t("admin.addCapstone")}
        </Button>
      </PageHeader>

      <div className="talent-modal-layout capstone-modal-layout capstone-admin-layout">
        <div className="talent-modal-layout__grid">
          <CapstoneGridCore
            key={sessionKey}
            selectedIds={EMPTY_SET}
            highlightCapstoneId={highlightCapstoneId}
            onItemClick={handleEditFromGrid}
            includeHiddenItems={showHidden}
          />
        </div>
        <CapstoneSearchPanel
          selectedIds={EMPTY_SET}
          onFindCapstone={handleFindCapstone}
          onAddCapstone={() => {}}
          onEditItem={handleEditFromSearch}
          includeHiddenItems={showHidden}
        />
      </div>

      <AdminCapstoneFormModal
        key={editingItem?.id ?? "create"}
        open={modalOpen}
        item={editingItem}
        defaultWotlkClass="mage"
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
      />
    </>
  );
}
