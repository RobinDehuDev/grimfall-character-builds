import type { TalentGameItem } from "@/lib/types";
import { TALENT_GRID_COLS, TALENT_GRID_ROWS } from "@/lib/talents";
import { TalentIcon } from "./TalentIcon";

interface TalentTreeColumnProps {
  treeName: string;
  treeIndex: number;
  talents: TalentGameItem[];
  gridRows?: number;
  gridCols?: number;
  selectedIds: ReadonlySet<string>;
  readOnly?: boolean;
  highlightedTalentId?: string | null;
  onToggle?: (talent: TalentGameItem) => void;
  onItemClick?: (talent: TalentGameItem) => void;
}

export function TalentTreeColumn({
  treeName,
  treeIndex,
  talents,
  gridRows = TALENT_GRID_ROWS,
  gridCols = TALENT_GRID_COLS,
  selectedIds,
  readOnly = false,
  highlightedTalentId = null,
  onToggle,
  onItemClick,
}: TalentTreeColumnProps) {
  const maxRow = Math.max(gridRows, ...talents.map((t) => t.row));
  const maxCol = Math.max(gridCols, ...talents.map((t) => t.col));

  return (
    <div className="talent-tree" data-tree-index={treeIndex}>
      <div className="talent-tree__header">{treeName}</div>
      <div
        className="talent-tree__grid"
        style={{
          gridTemplateRows: `repeat(${maxRow}, 40px)`,
          gridTemplateColumns: `repeat(${maxCol}, 1fr)`,
        }}
      >
        {talents.map((talent) => (
          <TalentIcon
            key={talent.id}
            talent={talent}
            selected={selectedIds.has(talent.id)}
            highlighted={highlightedTalentId === talent.id}
            readOnly={readOnly && !onItemClick}
            onToggle={() => onToggle?.(talent)}
            onItemClick={onItemClick ? () => onItemClick(talent) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
