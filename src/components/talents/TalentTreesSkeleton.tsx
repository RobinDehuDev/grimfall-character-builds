import { useTranslation } from "react-i18next";
import {
  TALENT_GRID_COLS,
  TALENT_GRID_ROWS,
  TALENT_TREE_COUNT,
} from "@/lib/talents";

const PLACEHOLDER_LABELS = ["", "", ""];

export function TalentTreesSkeleton() {
  const { t } = useTranslation();

  return (
    <div className="talent-trees" aria-busy="true" aria-label={t("talents.loadingClass")}>
      {Array.from({ length: TALENT_TREE_COUNT }, (_, treeIndex) => (
        <div
          key={treeIndex}
          className="talent-tree talent-tree--skeleton"
          data-tree-index={treeIndex}
        >
          <div className="talent-tree__header talent-skeleton-bar">
            {PLACEHOLDER_LABELS[treeIndex]}
          </div>
          <div
            className="talent-tree__grid"
            style={{
              gridTemplateRows: `repeat(${TALENT_GRID_ROWS}, 40px)`,
              gridTemplateColumns: `repeat(${TALENT_GRID_COLS}, 1fr)`,
            }}
          >
            {Array.from({ length: TALENT_GRID_ROWS * TALENT_GRID_COLS }, (_, i) => (
              <div key={i} className="talent-icon talent-icon--skeleton" aria-hidden />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
