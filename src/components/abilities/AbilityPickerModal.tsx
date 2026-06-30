import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import type { AbilityGameItem } from "@/lib/types";
import { fromConvexAbility } from "@/lib/types";
import {
  groupAbilitiesForClass,
  type AbilitySpecGroup,
} from "@/lib/abilities";
import {
  abilityClassTabRows,
  WOTLK_CLASS_COLORS,
  normalizeAbilityWotlkClass,
  type AbilityClassSlug,
} from "@/lib/wotlkClasses";
import { cn } from "@/lib/utils";
import {
  type AbilityDisplayMode,
  useAbilityDisplayMode,
} from "@/lib/abilityDisplayMode";
import { Button } from "@/components/ui/button";
import { AbilityDisplayModeToggle } from "./AbilityDisplayModeToggle";
import { AbilitySpecColumn } from "./AbilitySpecColumn";
import { AbilitySearchPanel } from "./AbilitySearchPanel";
import type { SpellSearchResult } from "../talents/TalentSearchPanel";

interface AbilityGridCoreProps {
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  readOnly?: boolean;
  showSelectedStrip?: boolean;
  sessionKey?: number;
  hydrateIds?: Id<"abilities">[];
  activeClass?: AbilityClassSlug;
  onActiveClassChange?: (slug: AbilityClassSlug) => void;
  highlightAbilityId?: string | null;
  onItemClick?: (ability: AbilityGameItem) => void;
  includeHiddenItems?: boolean;
  displayMode: AbilityDisplayMode;
}

export function AbilityGridCore({
  selectedIds,
  onSelectionChange,
  readOnly = false,
  showSelectedStrip = true,
  sessionKey = 0,
  hydrateIds = [],
  activeClass: controlledClass,
  onActiveClassChange,
  highlightAbilityId = null,
  onItemClick,
  includeHiddenItems = false,
  displayMode,
}: AbilityGridCoreProps) {
  const { t } = useTranslation();
  const manageMode = !!onItemClick;
  const abilityClasses = useQuery(api.abilities.listAbilityClasses);
  const [internalClass, setInternalClass] = useState<AbilityClassSlug>("death-knight");
  const [nameById, setNameById] = useState<Map<string, string>>(() => new Map());

  const activeClass = controlledClass ?? internalClass;
  const setActiveClass = (slug: AbilityClassSlug) => {
    if (onActiveClassChange) onActiveClassChange(slug);
    else setInternalClass(slug);
  };

  const classGroupsCache = useRef<Map<string, AbilitySpecGroup[]>>(new Map());
  const namesHydratedForSession = useRef(-1);

  const { playableClassTabs, hiddenClassTabs } = useMemo(() => {
    if (!abilityClasses) return { playableClassTabs: [], hiddenClassTabs: [] };
    const bySlug = new Map<string, { slug: string; name: string }>();
    for (const c of abilityClasses) {
      if (!c.wotlkClass) continue;
      bySlug.set(c.wotlkClass, { slug: c.wotlkClass, name: c.name });
    }
    const rows = abilityClassTabRows(manageMode);
    const toTabs = (slugs: string[]) =>
      slugs.filter((slug) => bySlug.has(slug)).map((slug) => bySlug.get(slug)!);
    return {
      playableClassTabs: toTabs(rows.playable),
      hiddenClassTabs: toTabs(rows.hidden),
    };
  }, [abilityClasses, manageMode]);

  const classTabs = useMemo(
    () => [...playableClassTabs, ...hiddenClassTabs],
    [playableClassTabs, hiddenClassTabs],
  );

  const effectiveClass =
    classTabs.find(
      (c) => c.slug === normalizeAbilityWotlkClass(activeClass),
    )?.slug ??
    classTabs[0]?.slug ??
    normalizeAbilityWotlkClass(activeClass);

  const abilities = useQuery(api.abilities.listByWotlkClass, {
    wotlkClass: effectiveClass,
    includeHiddenItems,
  });

  const gameAbilities = useMemo(
    () => (abilities ?? []).map(fromConvexAbility),
    [abilities],
  );

  const specGroups = useMemo(
    () => groupAbilitiesForClass(gameAbilities, effectiveClass),
    [gameAbilities, effectiveClass],
  );

  useEffect(() => {
    if (specGroups.length > 0) {
      classGroupsCache.current.set(effectiveClass, specGroups);
      setNameById((prev) => {
        const next = new Map(prev);
        for (const group of specGroups) {
          for (const ability of group.abilities) {
            next.set(ability.id, ability.name);
          }
        }
        return next;
      });
    }
  }, [specGroups, effectiveClass]);

  const hydratedItems = useQuery(
    api.abilities.getMany,
    hydrateIds.length > 0 && namesHydratedForSession.current !== sessionKey
      ? { ids: hydrateIds }
      : "skip",
  );

  useEffect(() => {
    if (!hydratedItems || namesHydratedForSession.current === sessionKey) return;
    namesHydratedForSession.current = sessionKey;
    setNameById((prev) => {
      const next = new Map(prev);
      for (const item of hydratedItems) {
        next.set(item._id, item.name);
      }
      return next;
    });
  }, [hydratedItems, sessionKey]);

  const cachedGroups = classGroupsCache.current.get(effectiveClass);
  const isLoadingClass = abilities === undefined && !cachedGroups;
  const isLoadingClasses = abilityClasses === undefined;
  const displayGroups =
    abilities !== undefined ? specGroups : (cachedGroups ?? []);

  useEffect(() => {
    if (!highlightAbilityId) return;
    const timer = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-ability-id="${highlightAbilityId}"]`,
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(timer);
  }, [highlightAbilityId, effectiveClass, displayGroups]);

  const maxAbilities = BUILD_SLOTS.ability;

  const handleToggle = useCallback(
    (ability: AbilityGameItem) => {
      if (manageMode) {
        onItemClick!(ability);
        return;
      }
      if (readOnly) return;
      const next = new Set(selectedIds);
      if (next.has(ability.id)) {
        next.delete(ability.id);
      } else {
        if (next.size >= maxAbilities) return;
        next.add(ability.id);
        setNameById((prev) => new Map(prev).set(ability.id, ability.name));
      }
      onSelectionChange(next);
    },
    [manageMode, onItemClick, readOnly, selectedIds, maxAbilities, onSelectionChange],
  );

  const selectedList = useMemo(
    () =>
      [...selectedIds].map((id) => ({
        id,
        name: nameById.get(id) ?? "…",
      })),
    [selectedIds, nameById],
  );

  const renderClassTab = (cls: { slug: string; name: string }) => (
    <button
      key={cls.slug}
      type="button"
      role="tab"
      aria-selected={effectiveClass === cls.slug}
      className={cn(
        "talent-class-tab",
        effectiveClass === cls.slug && "talent-class-tab--active",
      )}
      style={
        effectiveClass === cls.slug
          ? {
              borderBottomColor: WOTLK_CLASS_COLORS[cls.slug] ?? "var(--gold)",
            }
          : undefined
      }
      onClick={() => setActiveClass(cls.slug as AbilityClassSlug)}
    >
      {cls.name}
    </button>
  );

  return (
    <div className="ability-grid">
      <div className="ability-grid__toolbar">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {manageMode ? (
            <div className="flex min-w-0 flex-1 flex-col gap-0">
              <div
                className="talent-class-tabs"
                role="tablist"
                aria-busy={isLoadingClasses}
              >
                {playableClassTabs.map(renderClassTab)}
              </div>
              <div
                className="talent-class-tabs talent-class-tabs--admin-hidden"
                role="tablist"
                aria-label={t("admin.hiddenClasses")}
              >
                {hiddenClassTabs.map(renderClassTab)}
              </div>
            </div>
          ) : (
            <div
              className="talent-class-tabs flex-1"
              role="tablist"
              aria-busy={isLoadingClasses}
            >
              {playableClassTabs.map(renderClassTab)}
            </div>
          )}
          {!manageMode && (
            <span className="shrink-0 font-mono text-xs text-muted-foreground">
              {t("abilities.counter", {
                count: selectedIds.size,
                max: maxAbilities,
              })}
            </span>
          )}
        </div>
      </div>

      <div
        className="ability-spec-columns-area"
        aria-busy={isLoadingClass || isLoadingClasses}
      >
        <div
          className={cn(
            "ability-spec-columns",
            displayMode === "game"
              ? "ability-spec-columns--game"
              : "ability-spec-columns--compact",
            (abilities === undefined && cachedGroups) || isLoadingClass
              ? "ability-spec-columns--stale"
              : undefined,
          )}
        >
          {displayGroups.map((group) => (
            <AbilitySpecColumn
              key={group.key}
              group={group}
              selectedIds={selectedIds}
              highlightedAbilityId={highlightAbilityId}
              readOnly={readOnly && !manageMode}
              onToggle={handleToggle}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      </div>

      {!readOnly && showSelectedStrip && !manageMode && (
        <div
          className={cn(
            "talent-selected-strip",
            selectedList.length === 0 && "talent-selected-strip--empty",
          )}
        >
          <span className="talent-selected-strip__label">
            {t("abilities.selected")}
          </span>
          <div className="talent-selected-strip__items">
            {selectedList.map((ability) => (
              <button
                key={ability.id}
                type="button"
                className="talent-selected-chip ability-selected-chip"
                onClick={() => {
                  const next = new Set(selectedIds);
                  next.delete(ability.id);
                  onSelectionChange(next);
                }}
                title={t("abilities.clickToRemove")}
              >
                {ability.name}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AbilityModalEditor({
  draftIds,
  setDraftIds,
  sessionKey,
  hydrateIds,
  displayMode,
}: {
  draftIds: Set<string>;
  setDraftIds: Dispatch<SetStateAction<Set<string>>>;
  sessionKey: number;
  hydrateIds: Id<"abilities">[];
  displayMode: AbilityDisplayMode;
}) {
  const [activeClass, setActiveClass] = useState<AbilityClassSlug>("death-knight");
  const [highlightAbilityId, setHighlightAbilityId] = useState<string | null>(
    null,
  );

  const handleFindAbility = (result: SpellSearchResult) => {
    setActiveClass(
      normalizeAbilityWotlkClass(result.wotlkClass) as AbilityClassSlug,
    );
    setHighlightAbilityId(result._id);
    window.setTimeout(() => setHighlightAbilityId(null), 2500);
  };

  const handleAddAbility = (abilityId: string) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (next.size >= BUILD_SLOTS.ability) return next;
      next.add(abilityId);
      return next;
    });
  };

  return (
    <div className="talent-modal-layout ability-modal-layout">
      <div className="talent-modal-layout__grid ability-modal-layout__grid">
        <AbilityGridCore
          key={sessionKey}
          sessionKey={sessionKey}
          hydrateIds={hydrateIds}
          selectedIds={draftIds}
          onSelectionChange={setDraftIds}
          activeClass={activeClass}
          onActiveClassChange={setActiveClass}
          highlightAbilityId={highlightAbilityId}
          displayMode={displayMode}
        />
      </div>
      <AbilitySearchPanel
        selectedIds={draftIds}
        onFindAbility={handleFindAbility}
        onAddAbility={handleAddAbility}
      />
    </div>
  );
}

interface AbilityPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
}

export function AbilityPickerModal({
  open,
  onClose,
  selectedIds,
  onSelectionChange,
}: AbilityPickerModalProps) {
  const { t } = useTranslation();
  const { displayMode, setDisplayMode } = useAbilityDisplayMode();
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [sessionKey, setSessionKey] = useState(0);
  const [hydrateIds, setHydrateIds] = useState<Id<"abilities">[]>([]);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    if (open) {
      const ids = new Set(selectedIdsRef.current);
      setDraftIds(ids);
      setHydrateIds([...ids] as Id<"abilities">[]);
      setSessionKey((k) => k + 1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  const handleDone = () => {
    onSelectionChange(draftIds);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="talent-modal-backdrop ability-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="talent-modal ability-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ability-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="talent-modal__header">
          <h2 id="ability-modal-title" className="talent-modal__title ability-modal__title">
            {t("abilities.editAbilities")}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <AbilityDisplayModeToggle
              mode={displayMode}
              onChange={setDisplayMode}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={onClose}
              aria-label={t("common.close")}
            >
              <X className="size-4" />
            </Button>
          </div>
        </div>

        <div className="talent-modal__body">
          <AbilityModalEditor
            draftIds={draftIds}
            setDraftIds={setDraftIds}
            sessionKey={sessionKey}
            hydrateIds={hydrateIds}
            displayMode={displayMode}
          />
        </div>

        <div className="talent-modal__footer">
          <Button type="button" onClick={handleDone}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
