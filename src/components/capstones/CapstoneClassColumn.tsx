import type { CapstoneClassGroup } from "@/lib/capstones";
import type { CapstoneGameItem } from "@/lib/types";
import { WOTLK_CLASS_COLORS } from "@/lib/talents";
import { CapstoneIcon } from "./CapstoneIcon";

interface CapstoneClassColumnProps {
  group: CapstoneClassGroup;
  selectedIds: ReadonlySet<string>;
  highlightedCapstoneId?: string | null;
  readOnly?: boolean;
  onToggle: (capstone: CapstoneGameItem) => void;
  onItemClick?: (capstone: CapstoneGameItem) => void;
}

export function CapstoneClassColumn({
  group,
  selectedIds,
  highlightedCapstoneId = null,
  readOnly = false,
  onToggle,
  onItemClick,
}: CapstoneClassColumnProps) {
  return (
    <section
      className="capstone-class-column"
      data-wotlk-class={group.wotlkClass}
      aria-label={group.className}
    >
      <h3
        className="capstone-class-column__title"
        style={{
          borderBottomColor:
            WOTLK_CLASS_COLORS[group.wotlkClass] ?? "var(--gold)",
        }}
      >
        {group.className}
      </h3>
      <div className="capstone-class-column__icons">
        {group.capstones.map((capstone) => (
          <CapstoneIcon
            key={capstone.id}
            capstone={capstone}
            selected={selectedIds.has(capstone.id)}
            highlighted={highlightedCapstoneId === capstone.id}
            readOnly={readOnly && !onItemClick}
            onToggle={() => onToggle(capstone)}
            onItemClick={onItemClick ? () => onItemClick(capstone) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
