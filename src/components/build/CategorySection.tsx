import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryMeta } from "@/lib/categories";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import type { GameItem } from "@/lib/types";
import { itemBorderColor } from "@/lib/itemColors";
import { useCategoryLabel } from "@/lib/useCategoryLabel";
import { itemMatchesSearch } from "../../../convex/lib/itemSearch";
import { cn } from "@/lib/utils";
import { ItemPickerOption, ItemNameTooltip } from "@/components/items/ItemPickerOption";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

const qualityClass: Record<string, string> = {
  talent: "text-quality-uncommon",
  ability: "text-quality-rare",
  capstone: "text-quality-legendary",
  uncommon_re: "text-quality-uncommon",
  rare_re: "text-quality-rare",
  epic_re: "text-quality-epic",
  legendary_re: "text-quality-legendary",
};

interface CategorySectionProps {
  meta: CategoryMeta;
  items: GameItem[];
  slots: (string | null)[];
  usedItemIds: ReadonlySet<string>;
  activeSlot: number | null;
  onSlotClick: (index: number) => void;
  onItemSelect: (item: GameItem) => void;
  onSlotClear: (index: number) => void;
  onSlotReorder?: (fromIndex: number, toIndex: number) => void;
  getItemById: (id: string) => GameItem | undefined;
  className?: string;
}

export function CategorySection({
  meta,
  items,
  slots,
  usedItemIds,
  activeSlot,
  onSlotClick,
  onItemSelect,
  onSlotClear,
  onSlotReorder,
  getItemById,
  className,
}: CategorySectionProps) {
  const { t } = useTranslation();
  const { label, shortLabel } = useCategoryLabel(meta.key);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const maxSlots = BUILD_SLOTS[meta.key];
  const filled = slots.filter(Boolean).length;
  const isComplete = filled === maxSlots;
  const borderColor = itemBorderColor(meta.key);
  const reorderEnabled = !!onSlotReorder && meta.key.endsWith("_re");

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((item) => !usedItemIds.has(item.id))
      .filter((item) => {
        if (!q) return true;
        return itemMatchesSearch(
          {
            name: item.name,
            description: item.description,
            tags: "tags" in item ? item.tags : undefined,
          },
          q,
        );
      });
  }, [items, search, usedItemIds]);

  const handleDragStart = (index: number, e: React.DragEvent) => {
    if (!reorderEnabled || !slots[index]) return;
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    setDragIndex(index);
  };

  const handleDragOver = (index: number, e: React.DragEvent) => {
    if (!reorderEnabled || dragIndex === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  };

  const handleDrop = (index: number, e: React.DragEvent) => {
    if (!reorderEnabled || !onSlotReorder) return;
    e.preventDefault();
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (!Number.isNaN(fromIndex) && fromIndex !== index) {
      onSlotReorder(fromIndex, index);
    }
    setDragIndex(null);
    setDropIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDropIndex(null);
  };

  return (
    <FantasyCard className={cn("mb-6 h-fit self-start", className)}>
      <CardHeader
        className={cn(
          "flex flex-row items-center justify-between gap-2 pb-3",
          expanded && "border-b border-gold-muted/40",
        )}
      >
        <CardTitle
          className="min-w-0 truncate font-display text-sm tracking-widest uppercase"
          style={{ color: meta.color }}
        >
          {label}
        </CardTitle>
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 shrink-0 gap-1 px-2 text-[10px] tracking-widest uppercase"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            aria-label={expanded ? t("common.collapseSection") : t("common.expandSection")}
          >
            {expanded ? t("common.hide") : t("common.show")}
            {expanded ? (
              <ChevronUp className="size-3" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="size-3" strokeWidth={1.5} />
            )}
          </Button>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className="shrink-0 rounded-full font-mono text-xs whitespace-nowrap"
          >
            {filled} / {maxSlots}
          </Badge>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-3 pt-4">
          <div className="space-y-2">
            <Label htmlFor={`search-${meta.key}`} className="font-display text-[10px] tracking-widest uppercase">
              {t("build.searchCategory", { category: shortLabel })}
            </Label>
            <Input
              id={`search-${meta.key}`}
              type="search"
              placeholder={t("build.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {reorderEnabled && filled > 0 && (
            <p className="text-[11px] text-muted-foreground">{t("build.dragToReorder")}</p>
          )}

          {activeSlot !== null && (
            <div className="space-y-2">
              {slots[activeSlot] && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 w-full text-[10px] tracking-widest uppercase"
                  onClick={() => onSlotClear(activeSlot)}
                >
                  {t("build.clearSlot")}
                </Button>
              )}
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto rounded-md border border-gold-muted/40 bg-background/50 p-2">
                {filteredItems.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted-foreground">
                    {search ? t("build.noSearchResults") : t("build.noItemsAvailable")}
                  </p>
                ) : (
                  filteredItems.map((item) => (
                    <ItemPickerOption
                      key={item.id}
                      item={item}
                      onClick={() => onItemSelect(item)}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {slots.map((slotId, index) => {
              const item = slotId ? getItemById(slotId) : undefined;
              const isActive = activeSlot === index;
              const isDragging = dragIndex === index;
              const isDropTarget = dropIndex === index && dragIndex !== null && dragIndex !== index;

              return (
                <div
                  key={index}
                  className={cn(
                    "slot",
                    item && "slot--filled",
                    isActive && "slot--active",
                    isDragging && "slot--dragging",
                    isDropTarget && "slot--drag-over",
                    reorderEnabled && item && "slot--draggable",
                  )}
                  style={item ? { borderLeftColor: borderColor } : undefined}
                  draggable={reorderEnabled && !!item}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(index, e)}
                  onDrop={(e) => handleDrop(index, e)}
                  onDragEnd={handleDragEnd}
                  onDragLeave={() => {
                    if (dropIndex === index) setDropIndex(null);
                  }}
                  onClick={() => onSlotClick(index)}
                  onContextMenu={(e) => {
                    if (item) {
                      e.preventDefault();
                      onSlotClear(index);
                    }
                  }}
                >
                  <span className="slot__index">{t("build.slotIndex", { index: index + 1 })}</span>
                  {item && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-1/2 left-1 h-6 w-6 -translate-y-1/2 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClear(index);
                      }}
                      aria-label={t("build.clearSlot")}
                    >
                      <X className="size-3.5" strokeWidth={2} />
                    </Button>
                  )}
                  {reorderEnabled && item && (
                    <span
                      className="slot__drag-handle text-muted-foreground"
                      aria-hidden
                    >
                      <GripVertical className="size-3.5" strokeWidth={2} />
                    </span>
                  )}
                  {item ? (
                    <>
                      <ItemNameTooltip
                        item={item}
                        className={cn(
                          "slot__name slot__name--filled",
                          reorderEnabled && "slot__name--reorderable",
                          qualityClass[meta.key],
                        )}
                      >
                        {item.name}
                      </ItemNameTooltip>
                      {(item.type === "ability" || item.type === "talent") &&
                        item.levelRequirement > 0 && (
                        <span className="slot__level">
                          {t("common.level", { level: item.levelRequirement })}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="slot__empty">
                      {isActive ? t("build.selectItemAbove") : t("build.emptySlot")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      )}
    </FantasyCard>
  );
}
