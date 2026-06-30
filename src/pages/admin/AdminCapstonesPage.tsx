import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { AdminCapstoneFormModal } from "@/components/admin/AdminCapstoneFormModal";
import { AdminShowHiddenToggle } from "@/components/admin/AdminShowHiddenToggle";
import { ItemPickerOption } from "@/components/items/ItemPickerOption";
import { PageHeader, LoadingState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  WOTLK_CLASS_COLORS,
  WOTLK_CLASS_ORDER,
  type WotlkClassSlug,
} from "@/lib/talents";
import { fromConvexCapstone, type CapstoneGameItem } from "@/lib/types";
import { cn } from "@/lib/utils";
import { itemMatchesSearch } from "../../../convex/lib/itemSearch";

export function AdminCapstonesPage() {
  const { t } = useTranslation();
  const talentClasses = useQuery(api.talents.listTalentClasses);
  const [activeClass, setActiveClass] = useState<WotlkClassSlug>("death-knight");
  const [search, setSearch] = useState("");
  const [showHidden, setShowHidden] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapstoneGameItem | null>(null);

  const capstones = useQuery(api.capstones.list, {
    wotlkClass: activeClass,
    includeHiddenItems: showHidden,
  });

  const classTabs = useMemo(() => {
    if (!talentClasses) return [];
    const bySlug = new Map(
      talentClasses
        .filter((c) => c.wotlkClass)
        .map((c) => [c.wotlkClass!, { slug: c.wotlkClass!, name: c.name }]),
    );
    return WOTLK_CLASS_ORDER.filter((slug) => bySlug.has(slug)).map(
      (slug) => bySlug.get(slug)!,
    );
  }, [talentClasses]);

  const filteredItems = useMemo(() => {
    if (!capstones) return undefined;
    const rows = capstones.map(fromConvexCapstone);
    const q = search.trim().toLowerCase();
    if (!q) return rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows
      .filter((item) =>
        itemMatchesSearch(
          { name: item.name, description: item.description, tags: item.tags },
          q,
        ),
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [capstones, search]);

  const openCreate = () => {
    setEditingItem(null);
    setModalOpen(true);
  };

  const openEdit = (item: CapstoneGameItem) => {
    setEditingItem(item);
    setModalOpen(true);
  };

  if (talentClasses === undefined || filteredItems === undefined) {
    return <LoadingState />;
  }

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

      <div className="mb-4 flex flex-wrap gap-1" role="tablist">
        {classTabs.map((cls) => (
          <button
            key={cls.slug}
            type="button"
            role="tab"
            aria-selected={activeClass === cls.slug}
            className={cn(
              "talent-class-tab",
              activeClass === cls.slug && "talent-class-tab--active",
            )}
            style={
              activeClass === cls.slug
                ? {
                    borderBottomColor:
                      WOTLK_CLASS_COLORS[cls.slug] ?? "var(--gold)",
                  }
                : undefined
            }
            onClick={() => setActiveClass(cls.slug as WotlkClassSlug)}
          >
            {cls.name}
          </button>
        ))}
      </div>

      <div className="mb-4 max-w-md space-y-2">
        <Label htmlFor="capstone-admin-search">{t("common.search")}</Label>
        <Input
          id="capstone-admin-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("admin.searchCapstonesPlaceholder")}
        />
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        {t("admin.itemsCount", { count: filteredItems.length })}
      </p>

      <div className="max-h-[60vh] space-y-0.5 overflow-y-auto rounded border border-border p-2">
        {filteredItems.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            {t("admin.noCapstonesYet")}
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

      <AdminCapstoneFormModal
        open={modalOpen}
        item={editingItem}
        defaultWotlkClass={activeClass}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
