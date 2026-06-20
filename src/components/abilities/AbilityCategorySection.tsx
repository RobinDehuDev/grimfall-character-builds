import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Pencil, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CategoryMeta } from "@/lib/categories";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import type { GameItem } from "@/lib/types";
import { itemBorderColor } from "@/lib/itemColors";
import { useCategoryLabel } from "@/lib/useCategoryLabel";
import {
  abilityIdSetToSlots,
  slotsToAbilityIdSet,
} from "@/lib/abilities";
import { cn } from "@/lib/utils";
import { ItemNameTooltip } from "@/components/items/ItemPickerOption";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";
import { AbilityPickerModal } from "./AbilityPickerModal";

interface AbilityCategorySectionProps {
  meta: CategoryMeta;
  slots: (string | null)[];
  activeSlot: number | null;
  onSlotClick: (index: number) => void;
  onSlotClear: (index: number) => void;
  onSlotsChange: (slots: (string | null)[]) => void;
  getItemById: (id: string) => GameItem | undefined;
  className?: string;
}

export function AbilityCategorySection({
  meta,
  slots,
  activeSlot,
  onSlotClick,
  onSlotClear,
  onSlotsChange,
  getItemById,
  className,
}: AbilityCategorySectionProps) {
  const { t } = useTranslation();
  const { label } = useCategoryLabel(meta.key);
  const [expanded, setExpanded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const maxSlots = BUILD_SLOTS.ability;
  const filled = slots.filter(Boolean).length;
  const isComplete = filled === maxSlots;
  const borderColor = itemBorderColor(meta.key);

  const selectedIds = useMemo(() => slotsToAbilityIdSet(slots), [slots]);

  const handleSelectionChange = (ids: Set<string>) => {
    onSlotsChange(abilityIdSetToSlots(ids));
  };

  return (
    <>
      <FantasyCard className={cn("mb-6 h-fit self-start", className)}>
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-gold-muted/40 pb-3">
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
              aria-label={
                expanded ? t("common.collapseSection") : t("common.expandSection")
              }
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

        <CardContent className="space-y-3 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setModalOpen(true)}
          >
            <Pencil className="size-3.5" />
            {t("abilities.editAbilities")}
          </Button>

          {expanded && (
            <div className="flex flex-col gap-2">
              {slots.map((slotId, index) => {
                const item = slotId ? getItemById(slotId) : undefined;
                const isActive = activeSlot === index;

                return (
                  <div
                    key={index}
                    className={cn(
                      "slot",
                      item && "slot--filled",
                      isActive && "slot--active",
                    )}
                    style={item ? { borderLeftColor: borderColor } : undefined}
                    onClick={() => onSlotClick(index)}
                    onContextMenu={(e) => {
                      if (item) {
                        e.preventDefault();
                        onSlotClear(index);
                      }
                    }}
                  >
                    <span className="slot__index">
                      {t("build.slotIndex", { index: index + 1 })}
                    </span>
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
                    {item ? (
                      <ItemNameTooltip
                        item={item}
                        className="slot__name slot__name--filled text-quality-rare"
                      >
                        {item.name}
                      </ItemNameTooltip>
                    ) : (
                      <span className="slot__empty">{t("build.emptySlot")}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </FantasyCard>

      <AbilityPickerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
      />
    </>
  );
}
