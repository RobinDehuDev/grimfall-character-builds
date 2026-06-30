import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { Check, Crosshair, Pencil, Plus } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SpellSearchIconButton,
  SpellSearchResultRow,
} from "@/components/items/ItemPickerOption";

export type SpellSearchResult = {
  _id: string;
  kind: "talent" | "capstone" | "ability";
  name: string;
  description: string;
  tags: string[];
  wotlkClass?: string;
  treeName?: string;
  className?: string;
  levelRequirement?: number;
  skillLineIds?: number[];
};

interface TalentSearchPanelProps {
  selectedIds: ReadonlySet<string>;
  onFindTalent: (result: SpellSearchResult) => void;
  onAddTalent: (talentId: string) => void;
  onEditItem?: (result: SpellSearchResult) => void;
  includeHiddenItems?: boolean;
}

export function TalentSearchPanel({
  selectedIds,
  onFindTalent,
  onAddTalent,
  onEditItem,
  includeHiddenItems = false,
}: TalentSearchPanelProps) {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const results = useQuery(
    api.talents.searchSpellItems,
    debouncedQuery.trim().length >= 2
      ? {
          query: debouncedQuery.trim(),
          limit: 60,
          kinds: ["talent"] as const,
          includeHiddenItems,
        }
      : "skip",
  );

  const maxTalents = BUILD_SLOTS.talent;
  const atCap = selectedIds.size >= maxTalents;

  return (
    <aside className="talent-search-panel">
      <div className="talent-search-panel__header">
        <Label htmlFor="talent-spell-search" className="talent-search-panel__label">
          {t("talents.searchLabel")}
        </Label>
        <Input
          id="talent-spell-search"
          type="search"
          placeholder={t("talents.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="talent-search-panel__results">
        {debouncedQuery.trim().length < 2 ? (
          <p className="talent-search-panel__hint">{t("talents.searchHint")}</p>
        ) : results === undefined ? (
          <p className="talent-search-panel__hint">{t("common.loading")}</p>
        ) : results.length === 0 ? (
          <p className="talent-search-panel__hint">{t("talents.searchNoResults")}</p>
        ) : (
          <ul className="talent-search-panel__list">
            {results.map((result) => {
              const isSelected = selectedIds.has(result._id);
              const canAdd = !isSelected && !atCap;

              return (
                <li key={result._id} className="talent-search-panel__item">
                  <SpellSearchResultRow
                    name={result.name}
                    description={result.description}
                    actions={
                      <>
                        {result.wotlkClass && (
                          <SpellSearchIconButton
                            label={t("talents.findInTree")}
                            onClick={() => onFindTalent(result)}
                          >
                            <Crosshair className="size-3.5" strokeWidth={2} />
                          </SpellSearchIconButton>
                        )}
                        {onEditItem ? (
                          <SpellSearchIconButton
                            label={t("admin.editTalent")}
                            onClick={() => onEditItem(result)}
                          >
                            <Pencil className="size-3.5" strokeWidth={2} />
                          </SpellSearchIconButton>
                        ) : (
                          <SpellSearchIconButton
                            label={
                              isSelected
                                ? t("talents.alreadySelected")
                                : atCap
                                  ? t("talents.atCap")
                                  : t("talents.addToSelection")
                            }
                            onClick={() => onAddTalent(result._id)}
                            disabled={!canAdd}
                          >
                            {isSelected ? (
                              <Check className="size-3.5" strokeWidth={2} />
                            ) : (
                              <Plus className="size-3.5" strokeWidth={2} />
                            )}
                          </SpellSearchIconButton>
                        )}
                      </>
                    }
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
