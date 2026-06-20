import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { itemBorderColor } from "@/lib/itemColors";
import {
  qualityColorClass,
  slotCategoryColorClass,
} from "@/lib/categories";
import { getItemSlotCategory, type GameItem } from "@/lib/types";
import type { ItemType } from "@/lib/categories";
import { Card, CardContent } from "@/components/ui/card";

function itemColorClass(item: GameItem): string {
  if (item.type === "runicEnhancement") {
    return qualityColorClass(item.quality);
  }
  return slotCategoryColorClass(getItemSlotCategory(item));
}

interface ItemCardProps {
  item: GameItem;
  selected?: boolean;
  onClick?: () => void;
}

export function ItemCard({ item, selected, onClick }: ItemCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      className={cn(
        "cursor-pointer border-l-[3px] py-0 transition-colors hover:bg-secondary/50",
        selected && "border-primary bg-primary/10",
        onClick && "cursor-pointer",
      )}
      style={{ borderLeftColor: itemBorderColor(item) }}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      <CardContent className="p-3">
        <div className={cn("text-sm font-semibold", itemColorClass(item))}>
          {item.name}
        </div>
        {(item.type === "ability" || item.type === "talent") &&
          item.levelRequirement > 0 && (
            <div className="mb-1 text-[11px] text-muted-foreground">
              {t("common.requiresLevel", { level: item.levelRequirement })}
            </div>
          )}
        {item.type === "runicEnhancement" && (
          <div className="mb-1 text-[11px] text-muted-foreground">
            {t(`itemTypes.qualities.${item.quality}`)}
          </div>
        )}
        <div className="line-clamp-2 text-xs text-muted-foreground">{item.description}</div>
      </CardContent>
    </Card>
  );
}

export function itemTypeLabel(t: (key: string) => string, type: ItemType): string {
  return t(`itemTypes.${type}`);
}
