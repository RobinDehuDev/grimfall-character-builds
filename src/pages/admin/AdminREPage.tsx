import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminREFormModal } from "@/components/admin/AdminREFormModal";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { ItemPickerOption } from "@/components/items/ItemPickerOption";
import { PageHeader, LoadingState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { qualityColorClass, type RunicQuality } from "@/lib/categories";
import { fromConvexRunicEnhancement, type RunicEnhancementGameItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { itemMatchesSearch } from "../../../convex/lib/itemSearch";

const RE_ADMIN_QUALITIES: RunicQuality[] = ["uncommon", "rare", "legendary"];

export function AdminREPage() {
  const { t } = useTranslation();
  const [quality, setQuality] = useState<RunicQuality>("uncommon");
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RunicEnhancementGameItem | null>(null);

  const items = useQuery(api.runicEnhancements.list, {
    quality,
    includeHiddenItems: showHidden,
  });

  const filteredItems = useMemo(() => {
    if (!items) return undefined;
    const rows = items.map(fromConvexRunicEnhancement);
    const q = search.trim().toLowerCase();
    if (!q) return rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows
      .filter((item) =>
        itemMatchesSearch(
          { name: item.name, description: item.description },
          q,
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, search]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (item: RunicEnhancementGameItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  if (filteredItems === undefined) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHeader
        title={t("admin.manageRE")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      >
        <AdminShowHiddenToggle
          checked={showHidden}
          onCheckedChange={setShowHidden}
        />
        <Button type="button" onClick={openCreate}>
          {t("admin.addRE")}
        </Button>
      </PageHeader>

      <div className="mb-4 flex flex-wrap gap-2" role="tablist">
        {RE_ADMIN_QUALITIES.map((q) => (
          <button
            key={q}
            type="button"
            role="tab"
            aria-selected={quality === q}
            className={cn(
              "rounded border px-3 py-1.5 text-sm font-semibold transition-colors",
              quality === q
                ? "border-gold bg-secondary"
                : "border-border hover:bg-secondary/60",
              qualityColorClass(q),
            )}
            onClick={() => setQuality(q)}
          >
            {t(`itemTypes.qualities.${q}`)}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-md space-y-2">
        <Label htmlFor="re-admin-search">{t("common.search")}</Label>
        <Input
          id="re-admin-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchREPlaceholder")}
        />
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {t("admin.itemsCount", { count: filteredItems.length })}
      </p>

      <div className="max-h-[60vh] space-y-0.5 overflow-y-auto rounded border border-border p-2">
        {filteredItems.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            {t("admin.noREYet")}
          </p>
        ) : (
          filteredItems.map((item) => (
            <ItemPickerOption
              key={item.id}
              item={item}
              onClick={() => openEdit(item)}
            />
          ))
        )}
      </div>

      <AdminREFormModal
        open={modalOpen}
        item={editingItem}
        defaultQuality={quality}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
