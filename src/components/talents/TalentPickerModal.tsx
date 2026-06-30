import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createPortal } from "react-dom";
import { useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import type { TalentGameItem } from "@/lib/types";
import { fromConvexTalent } from "@/lib/types";
import {
  TALENT_GRID_COLS,
  TALENT_GRID_ROWS,
  WOTLK_CLASS_COLORS,
  WOTLK_CLASS_ORDER,
  type WotlkClassSlug,
} from "@/lib/talents";
import { normalizeAbilityWotlkClass } from "@/lib/wotlkClasses";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { TalentTreeColumn } from "./TalentTreeColumn";
import {
  TalentSearchPanel,
  type SpellSearchResult,
} from "./TalentSearchPanel";

type TreeGroup = {
  treeIndex: number;
  treeName: string;
  talents: TalentGameItem[];
};

function groupTalentsIntoTrees(gameTalents: TalentGameItem[]): TreeGroup[] {
  const grouped = new Map<number, { treeName: string; talents: TalentGameItem[] }>();
  for (const talent of gameTalents) {
    const entry = grouped.get(talent.treeIndex) ?? {
      treeName: talent.treeName,
      talents: [],
    };
    entry.talents.push(talent);
    grouped.set(talent.treeIndex, entry);
  }
  return [...grouped.entries()]
    .sort(([a], [b]) => a - b)
    .map(([treeIndex, data]) => ({ treeIndex, ...data }));
}

interface TalentGridCoreProps {
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  readOnly?: boolean;
  showSelectedStrip?: boolean;
  sessionKey?: number;
  hydrateIds?: Id<"talents">[];
  activeClass?: WotlkClassSlug;
  onActiveClassChange?: (slug: WotlkClassSlug) => void;
  highlightTalentId?: string | null;
  maxSelections?: number;
  onItemClick?: (talent: TalentGameItem) => void;
  includeHiddenItems?: boolean;
}

export function TalentGridCore({
  selectedIds,
  onSelectionChange,
  readOnly = false,
  showSelectedStrip = true,
  sessionKey = 0,
  hydrateIds = [],
  activeClass: controlledClass,
  onActiveClassChange,
  highlightTalentId = null,
  maxSelections = BUILD_SLOTS.talent,
  onItemClick,
  includeHiddenItems = false,
}: TalentGridCoreProps) {
  const { t } = useTranslation();
  const talentClasses = useQuery(api.talents.listTalentClasses);
  const [internalClass, setInternalClass] = useState<WotlkClassSlug>("death-knight");
  const [nameById, setNameById] = useState<Map<string, string>>(() => new Map());

  const activeClass = controlledClass ?? internalClass;
  const setActiveClass = (slug: WotlkClassSlug) => {
    if (onActiveClassChange) onActiveClassChange(slug);
    else setInternalClass(slug);
  };

  const classTreesCache = useRef<Map<string, TreeGroup[]>>(new Map());
  const namesHydratedForSession = useRef(-1);

  const classTabs = useMemo(() => {
    if (!talentClasses) return [];
    const bySlug = new Map(
      talentClasses
        .filter((c) => c.wotlkClass)
        .map((c) => [c.wotlkClass!, { slug: c.wotlkClass!, name: c.name }]),
    );
    return WOTLK_CLASS_ORDER.filter((slug) => bySlug.has(slug)).map(
      (slug) => bySlug.get(slug)!,
    );
  }, [talentClasses]);

  const effectiveClass =
    classTabs.find(
      (c) => c.slug === normalizeAbilityWotlkClass(activeClass),
    )?.slug ??
    classTabs[0]?.slug ??
    normalizeAbilityWotlkClass(activeClass);

  const talents = useQuery(api.talents.listByWotlkClass, {
    wotlkClass: effectiveClass,
    includeHiddenItems,
  });

  const gameTalents = useMemo(
    () => (talents ?? []).map(fromConvexTalent),
    [talents],
  );

  const trees = useMemo(() => groupTalentsIntoTrees(gameTalents), [gameTalents]);

  useEffect(() => {
    if (trees.length > 0) {
      classTreesCache.current.set(effectiveClass, trees);
      setNameById((prev) => {
        const next = new Map(prev);
        for (const tree of trees) {
          for (const talent of tree.talents) {
            next.set(talent.id, talent.name);
          }
        }
        return next;
      });
    }
  }, [trees, effectiveClass]);

  const idsForHydration = hydrateIds;

  const hydratedItems = useQuery(
    api.talents.getMany,
    idsForHydration.length > 0 && namesHydratedForSession.current !== sessionKey
      ? { ids: idsForHydration }
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

  const cachedTrees = classTreesCache.current.get(effectiveClass);
  const isLoadingClass = talents === undefined && !cachedTrees;
  const isLoadingClasses = talentClasses === undefined;
  const displayTrees = talents !== undefined ? trees : (cachedTrees ?? []);

  useEffect(() => {
    if (!highlightTalentId) return;
    const timer = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-talent-id="${highlightTalentId}"]`,
      );
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(timer);
  }, [highlightTalentId, effectiveClass, displayTrees]);

  const maxTalents = maxSelections;

  const manageMode = !!onItemClick;

  const handleToggle = useCallback(
    (talent: TalentGameItem) => {
      if (manageMode) {
        onItemClick!(talent);
        return;
      }
      if (readOnly) return;
      const next = new Set(selectedIds);
      if (next.has(talent.id)) {
        next.delete(talent.id);
      } else {
        if (next.size >= maxTalents) return;
        next.add(talent.id);
        setNameById((prev) => new Map(prev).set(talent.id, talent.name));
      }
      onSelectionChange(next);
    },
    [manageMode, onItemClick, readOnly, selectedIds, maxTalents, onSelectionChange],
  );

  const selectedList = useMemo(
    () =>
      [...selectedIds].map((id) => ({
        id,
        name: nameById.get(id) ?? "…",
      })),
    [selectedIds, nameById],
  );

  return (
    <div className="talent-grid">
      <div className="talent-grid__toolbar">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div
            className="talent-class-tabs flex-1"
            role="tablist"
            aria-busy={isLoadingClasses}
          >
            {classTabs.map((cls) => (
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
                  ? { borderBottomColor: WOTLK_CLASS_COLORS[cls.slug] ?? "var(--gold)" }
                  : undefined
              }
              onClick={() => setActiveClass(cls.slug as WotlkClassSlug)}
            >
              {cls.name}
            </button>
          ))}
        </div>
        {!manageMode && (
        <span className="shrink-0 font-mono text-xs text-muted-foreground">
          {t("talents.counter", { count: selectedIds.size, max: maxTalents })}
        </span>
        )}
        </div>
      </div>

      <div
        className="talent-trees-area"
        aria-busy={isLoadingClass || isLoadingClasses}
      >
        <div
          className={cn(
            "talent-trees",
            (talents === undefined && cachedTrees) || isLoadingClass
              ? "talent-trees--stale"
              : undefined,
          )}
        >
          {displayTrees.map((tree) => (
            <TalentTreeColumn
              key={tree.treeIndex}
              treeIndex={tree.treeIndex}
              treeName={tree.treeName}
              talents={tree.talents}
              gridRows={TALENT_GRID_ROWS}
              gridCols={TALENT_GRID_COLS}
              selectedIds={selectedIds}
              readOnly={readOnly && !manageMode}
              highlightedTalentId={highlightTalentId}
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
          <span className="talent-selected-strip__label">{t("talents.selected")}</span>
          <div className="talent-selected-strip__items">
            {selectedList.map((talent) => (
              <button
                key={talent.id}
                type="button"
                className="talent-selected-chip"
                onClick={() => {
                  const next = new Set(selectedIds);
                  next.delete(talent.id);
                  onSelectionChange(next);
                }}
                title={t("talents.clickToRemove")}
              >
                {talent.name}
                <span aria-hidden>×</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TalentModalEditor({
  draftIds,
  setDraftIds,
  sessionKey,
  hydrateIds,
  maxSelections,
}: {
  draftIds: Set<string>;
  setDraftIds: Dispatch<SetStateAction<Set<string>>>;
  sessionKey: number;
  hydrateIds: Id<"talents">[];
  maxSelections: number;
}) {
  const [activeClass, setActiveClass] = useState<WotlkClassSlug>("death-knight");
  const [highlightTalentId, setHighlightTalentId] = useState<string | null>(null);

  const handleFindTalent = (result: SpellSearchResult) => {
    setActiveClass(
      normalizeAbilityWotlkClass(result.wotlkClass) as WotlkClassSlug,
    );
    setHighlightTalentId(result._id);
    window.setTimeout(() => setHighlightTalentId(null), 2500);
  };

  const handleAddTalent = (talentId: string) => {
    setDraftIds((prev) => {
      const next = new Set(prev);
      if (next.size >= maxSelections) return next;
      next.add(talentId);
      return next;
    });
  };

  return (
    <div className="talent-modal-layout talent-picker-modal-layout">
      <div className="talent-modal-layout__grid talent-picker-modal-layout__grid">
        <TalentGridCore
          key={sessionKey}
          sessionKey={sessionKey}
          hydrateIds={hydrateIds}
          selectedIds={draftIds}
          onSelectionChange={setDraftIds}
          activeClass={activeClass}
          onActiveClassChange={setActiveClass}
          highlightTalentId={highlightTalentId}
          maxSelections={maxSelections}
        />
      </div>
      <TalentSearchPanel
        selectedIds={draftIds}
        onFindTalent={handleFindTalent}
        onAddTalent={handleAddTalent}
      />
    </div>
  );
}

interface TalentPickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  maxSelections?: number;
  titleKey?: string;
}

export function TalentPickerModal({
  open,
  onClose,
  selectedIds,
  onSelectionChange,
  maxSelections = BUILD_SLOTS.talent,
  titleKey = "talents.editTalents",
}: TalentPickerModalProps) {
  const { t } = useTranslation();
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [sessionKey, setSessionKey] = useState(0);
  const [hydrateIds, setHydrateIds] = useState<Id<"talents">[]>([]);
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    if (open) {
      const ids = new Set(selectedIdsRef.current);
      setDraftIds(ids);
      setHydrateIds([...ids] as Id<"talents">[]);
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
      className="talent-modal-backdrop talent-picker-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="talent-modal talent-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="talent-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="talent-modal__header">
          <h2 id="talent-modal-title" className="talent-modal__title">
            {t(titleKey)}
          </h2>
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

        <div className="talent-modal__body">
          <TalentModalEditor
            draftIds={draftIds}
            setDraftIds={setDraftIds}
            sessionKey={sessionKey}
            hydrateIds={hydrateIds}
            maxSelections={maxSelections}
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
