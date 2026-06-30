import { useCallback, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import { groupCapstonesByClass } from "@/lib/capstones";
import type { CapstoneGameItem } from "@/lib/types";
import { fromConvexCapstone } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CapstoneClassColumn } from "./CapstoneClassColumn";

interface CapstoneGridCoreProps {
  selectedIds: ReadonlySet<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  readOnly?: boolean;
  highlightCapstoneId?: string | null;
  onItemClick?: (capstone: CapstoneGameItem) => void;
  includeHiddenItems?: boolean;
  maxSelections?: number;
}

export function CapstoneGridCore({
  selectedIds,
  onSelectionChange,
  readOnly = false,
  highlightCapstoneId = null,
  onItemClick,
  includeHiddenItems = false,
  maxSelections = BUILD_SLOTS.capstone,
}: CapstoneGridCoreProps) {
  const { t } = useTranslation();
  const manageMode = !!onItemClick;

  const capstones = useQuery(api.capstones.list, { includeHiddenItems });

  const classGroups = useMemo(() => {
    if (!capstones) return [];
    return groupCapstonesByClass(capstones.map(fromConvexCapstone));
  }, [capstones]);

  const isLoading = capstones === undefined;

  useEffect(() => {
    if (!highlightCapstoneId) return;
    const timer = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-capstone-id="${highlightCapstoneId}"]`,
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth", inline: "center" });
    });
    return () => cancelAnimationFrame(timer);
  }, [highlightCapstoneId, classGroups]);

  const handleToggle = useCallback(
    (capstone: CapstoneGameItem) => {
      if (manageMode) {
        onItemClick!(capstone);
        return;
      }
      if (readOnly || !onSelectionChange) return;
      const next = new Set(selectedIds);
      if (next.has(capstone.id)) {
        next.delete(capstone.id);
      } else {
        if (next.size >= maxSelections) {
          next.clear();
        }
        next.add(capstone.id);
      }
      onSelectionChange(next);
    },
    [
      manageMode,
      onItemClick,
      readOnly,
      onSelectionChange,
      selectedIds,
      maxSelections,
    ],
  );

  return (
    <div className="capstone-grid">
      <div
        className={cn(
          "capstone-class-columns-area",
          isLoading && "capstone-class-columns-area--loading",
        )}
      >
        {isLoading ? (
          <p className="capstone-grid__loading">{t("common.loading")}</p>
        ) : classGroups.length === 0 ? (
          <p className="capstone-grid__empty">{t("admin.noCapstonesYet")}</p>
        ) : (
          <div className="capstone-class-columns">
            {classGroups.map((group) => (
              <CapstoneClassColumn
                key={group.wotlkClass}
                group={group}
                selectedIds={selectedIds}
                highlightedCapstoneId={highlightCapstoneId}
                readOnly={readOnly}
                onToggle={handleToggle}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
