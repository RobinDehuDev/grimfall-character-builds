import type { AbilityGameItem } from "@/lib/types";
import type { AbilitySpecGroup } from "@/lib/abilities";
import { AbilityIcon } from "./AbilityIcon";

interface AbilitySpecColumnProps {
  group: AbilitySpecGroup;
  selectedIds: ReadonlySet<string>;
  highlightedAbilityId?: string | null;
  readOnly?: boolean;
  onToggle: (ability: AbilityGameItem) => void;
}

export function AbilitySpecColumn({
  group,
  selectedIds,
  highlightedAbilityId = null,
  readOnly = false,
  onToggle,
}: AbilitySpecColumnProps) {
  return (
    <section className="ability-spec-column" aria-label={group.name}>
      <h3 className="ability-spec-column__title">{group.name}</h3>
      <div className="ability-spec-grid">
        {group.abilities.map((ability) => (
          <AbilityIcon
            key={ability.id}
            ability={ability}
            selected={selectedIds.has(ability.id)}
            highlighted={highlightedAbilityId === ability.id}
            readOnly={readOnly}
            onToggle={() => onToggle(ability)}
          />
        ))}
      </div>
    </section>
  );
}
