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
import type { SpellSearchResult } from "../talents/TalentSearchPanel";

interface CapstoneSearchPanelProps {
  selectedIds: ReadonlySet<string>;
  onFindCapstone: (result: SpellSearchResult) => void;
  onAddCapstone: (capstoneId: string) => void;
  onEditItem?: (result: SpellSearchResult) => void;
  includeHiddenItems?: boolean;
}

export function CapstoneSearchPanel({
  selectedIds,
  onFindCapstone,
  onAddCapstone,
  onEditItem,
  includeHiddenItems = false,
}: CapstoneSearchPanelProps) {
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
          kinds: ["capstone"] as const,
          includeHiddenItems,
        }
      : "skip",
  );

  const maxCapstones = BUILD_SLOTS.capstone;
  const atCap = selectedIds.size >= maxCapstones;

  return (
    <aside className="talent-search-panel">
      <div className="talent-search-panel__header">
        <Label
          htmlFor="capstone-spell-search"
          className="talent-search-panel__label"
        >
          {t("capstones.searchLabel")}
        </Label>
        <Input
          id="capstone-spell-search"
          type="search"
          placeholder={t("capstones.searchPlaceholder")}
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="talent-search-panel__results">
        {debouncedQuery.trim().length < 2 ? (
          <p className="talent-search-panel__hint">{t("capstones.searchHint")}</p>
        ) : results === undefined ? (
          <p className="talent-search-panel__hint">{t("common.loading")}</p>
        ) : results.length === 0 ? (
          <p className="talent-search-panel__hint">
            {t("capstones.searchNoResults")}
          </p>
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
                            label={t("capstones.findInGrid")}
                            onClick={() => onFindCapstone(result)}
                          >
                            <Crosshair className="size-3.5" strokeWidth={2} />
                          </SpellSearchIconButton>
                        )}
                        {onEditItem ? (
                          <SpellSearchIconButton
                            label={t("admin.editCapstone")}
                            onClick={() => onEditItem(result)}
                          >
                            <Pencil className="size-3.5" strokeWidth={2} />
                          </SpellSearchIconButton>
                        ) : (
                          <SpellSearchIconButton
                            label={
                              isSelected
                                ? t("capstones.alreadySelected")
                                : atCap
                                  ? t("capstones.atCap")
                                  : t("capstones.addToSelection")
                            }
                            onClick={() => onAddCapstone(result._id)}
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
