import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CATEGORIES, RUNIC_CATEGORIES } from "../../lib/categories";
import type { GameItem } from "../../lib/types";
import { buildItemMap, fromSlotPickerRow } from "../../lib/types";
import { CategorySection } from "./CategorySection";
import { TalentCategorySection } from "../talents/TalentCategorySection";
import { AbilityCategorySection } from "../abilities/AbilityCategorySection";
import {
  isBuildComplete,
  slotsToConvexIds,
  stripUnresolvedSlotIds,
  useBuildDraft,
} from "../../hooks/useBuildDraft";
import { useTranslation } from "react-i18next";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

interface BuildEditorProps {
  mode: "create" | "edit";
  buildId?: Id<"builds">;
}

export function BuildEditor({ mode, buildId }: BuildEditorProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const classes = useQuery(api.classes.list);
  const existingBuild = useQuery(
    api.builds.get,
    buildId ? { id: buildId } : "skip",
  );

  const draft = useBuildDraft();
  const {
    title,
    setTitle,
    description,
    setDescription,
    classId,
    setClassId,
    isPublic,
    setIsPublic,
    slots,
    setSlots,
    clearDraft,
    resetSlots,
    loadFromBuild,
    hydrated,
  } = draft;

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedBuildRef = useRef(false);

  const createBuild = useMutation(api.builds.create);
  const updateBuild = useMutation(api.builds.update);

  useEffect(() => {
    if (mode === "edit" && existingBuild && hydrated && !loadedBuildRef.current) {
      loadFromBuild(existingBuild);
      loadedBuildRef.current = true;
    }
  }, [mode, existingBuild, hydrated, loadFromBuild]);

  const usedItemIds = useMemo(() => {
    const ids = new Set<string>();
    for (const cat of CATEGORIES) {
      for (const id of slots[cat.key]) {
        if (id) ids.add(id);
      }
    }
    return ids;
  }, [slots]);

  const convexSlotIds = useMemo(() => slotsToConvexIds(slots), [slots]);

  const resolvedItems = useQuery(api.buildItems.resolveBuildItems, {
    talentIds: convexSlotIds.talents,
    abilityIds: convexSlotIds.abilities,
    capstoneIds: convexSlotIds.capstone,
    runicEnhancementIds: [
      ...convexSlotIds.uncommonRes,
      ...convexSlotIds.rareRes,
      ...convexSlotIds.epicRes,
      ...convexSlotIds.legendaryRes,
    ],
  });

  const itemCache = useMemo(() => {
    if (!resolvedItems) return new Map<string, GameItem>();
    return buildItemMap(resolvedItems);
  }, [resolvedItems]);

  useEffect(() => {
    if (!resolvedItems) return;
    setSlots((current) =>
      stripUnresolvedSlotIds(current, new Set(itemCache.keys())),
    );
  }, [resolvedItems, itemCache, setSlots]);

  if (!hydrated) {
    return <LoadingState />;
  }

  if (mode === "edit" && existingBuild === undefined) {
    return <LoadingState>{t("build.loadingBuild")}</LoadingState>;
  }

  if (mode === "edit" && existingBuild === null) {
    return <EmptyState>{t("build.notFound")}</EmptyState>;
  }

  const effectiveClassId = classId || "";

  const handleClassChange = (newClassId: string) => {
    setClassId(newClassId);
    if (newClassId !== classId) {
      resetSlots();
      setActiveCategory(null);
      setActiveSlot(null);
    }
  };

  const handleSlotClick = (category: string, index: number) => {
    setActiveCategory(category);
    setActiveSlot(index);
  };

  const handleItemSelect = (category: string, item: GameItem) => {
    setSlots((prev) => {
      const next = { ...prev };
      const catSlots = [...next[category as keyof typeof next]];

      if (activeSlot !== null && activeCategory === category) {
        catSlots[activeSlot] = item.id;
      } else {
        const emptyIndex = catSlots.findIndex((s) => s === null);
        if (emptyIndex !== -1) catSlots[emptyIndex] = item.id;
      }

      next[category as keyof typeof next] = catSlots;
      return next;
    });

    if (activeSlot !== null && activeCategory === category) {
      const catSlots = slots[category as keyof typeof slots];
      if (activeSlot < catSlots.length - 1) {
        setActiveSlot(activeSlot + 1);
      }
    }
  };

  const handleSlotClear = (category: string, index: number) => {
    setSlots((prev) => {
      const next = { ...prev };
      const catSlots = [...next[category as keyof typeof next]];
      catSlots[index] = null;
      next[category as keyof typeof next] = catSlots;
      return next;
    });
  };

  const handleSlotReorder = (
    category: string,
    fromIndex: number,
    toIndex: number,
  ) => {
    if (fromIndex === toIndex) return;

    setSlots((prev) => {
      const next = { ...prev };
      const catSlots = [...next[category as keyof typeof next]];
      const temp = catSlots[fromIndex];
      catSlots[fromIndex] = catSlots[toIndex];
      catSlots[toIndex] = temp;
      next[category as keyof typeof next] = catSlots;
      return next;
    });

    if (activeCategory === category && activeSlot !== null) {
      if (activeSlot === fromIndex) setActiveSlot(toIndex);
      else if (activeSlot === toIndex) setActiveSlot(fromIndex);
    }
  };

  const handleSave = async () => {
    setError(null);
    if (!title.trim()) {
      setError(t("build.errorTitleRequired"));
      return;
    }
    if (!isBuildComplete(slots)) {
      setError(t("build.errorSlotsIncomplete"));
      return;
    }

    setSaving(true);
    try {
      const slotIds = slotsToConvexIds(slots);
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        classId: effectiveClassId
          ? (effectiveClassId as Id<"classes">)
          : undefined,
        isPublic,
        ...slotIds,
      };

      if (mode === "create") {
        const id = await createBuild(payload);
        clearDraft();
        navigate(`/builds/${id}`);
      } else if (buildId) {
        await updateBuild({ id: buildId, ...payload });
        clearDraft();
        navigate(`/builds/${buildId}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : t("build.errorSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const getItemById = (id: string) => itemCache.get(id);

  return (
    <>
      <PageHeader
        title={mode === "create" ? t("build.createTitle") : t("build.editTitle")}
        description={t("build.editorDescription")}
      />

      <FantasyCard className="mb-6">
        <CardHeader className="border-b border-gold-muted/40 pb-3">
          <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
            {t("build.detailsTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="build-title">{t("build.titleLabel")}</Label>
              <Input
                id="build-title"
                type="text"
                placeholder={t("build.titlePlaceholder")}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="build-class">{t("build.classLabel")}</Label>
              <Select
                value={effectiveClassId || "none"}
                onValueChange={(v) => handleClassChange(v === "none" ? "" : v)}
              >
                <SelectTrigger id="build-class">
                  <SelectValue placeholder={t("common.noClass")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("common.noClass")}</SelectItem>
                  {(classes ?? []).map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="build-desc">{t("build.descriptionLabel")}</Label>
              <Textarea
                id="build-desc"
                placeholder={t("build.descriptionPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2 md:col-span-2">
              <Checkbox
                id="build-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
              />
              <Label htmlFor="build-public" className="font-sans text-sm font-normal normal-case tracking-normal">
                {t("build.sharePublic")}
              </Label>
            </div>
          </div>
        </CardContent>
      </FantasyCard>

      <div className="mt-6 grid items-start gap-6 xl:grid-cols-3">
        <AbilityCategorySection
          meta={CATEGORIES.find((c) => c.key === "ability")!}
          slots={slots.ability}
          activeSlot={activeCategory === "ability" ? activeSlot : null}
          onSlotClick={(index) => handleSlotClick("ability", index)}
          onSlotClear={(index) => handleSlotClear("ability", index)}
          onSlotsChange={(abilitySlots) => {
            setSlots((prev) => ({ ...prev, ability: abilitySlots }));
          }}
          getItemById={getItemById}
        />
        <div>
          <TalentCategorySection
            meta={CATEGORIES.find((c) => c.key === "talent")!}
            slots={slots.talent}
            activeSlot={activeCategory === "talent" ? activeSlot : null}
            onSlotClick={(index) => handleSlotClick("talent", index)}
            onSlotClear={(index) => handleSlotClear("talent", index)}
            onSlotsChange={(talentSlots) => {
              setSlots((prev) => ({ ...prev, talent: talentSlots }));
            }}
            getItemById={getItemById}
          />
          <CategorySectionWithQuery
            meta={CATEGORIES.find((c) => c.key === "capstone")!}
            classId={effectiveClassId ? (effectiveClassId as Id<"classes">) : undefined}
            slots={slots.capstone}
            usedItemIds={usedItemIds}
            activeSlot={activeCategory === "capstone" ? activeSlot : null}
            onSlotClick={(index) => handleSlotClick("capstone", index)}
            onItemSelect={(item) => handleItemSelect("capstone", item)}
            onSlotClear={(index) => handleSlotClear("capstone", index)}
            getItemById={getItemById}
          />
        </div>
        <div>
          {RUNIC_CATEGORIES.map((meta) => (
            <CategorySectionWithQuery
              key={meta.key}
              meta={meta}
              classId={effectiveClassId ? (effectiveClassId as Id<"classes">) : undefined}
              slots={slots[meta.key]}
              usedItemIds={usedItemIds}
              activeSlot={activeCategory === meta.key ? activeSlot : null}
              onSlotClick={(index) => handleSlotClick(meta.key, index)}
              onItemSelect={(item) => handleItemSelect(meta.key, item)}
              onSlotClear={(index) => handleSlotClear(meta.key, index)}
              onSlotReorder={(from, to) => handleSlotReorder(meta.key, from, to)}
              getItemById={getItemById}
            />
          ))}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="mt-6 flex justify-end gap-3 border-t border-gold-muted/40 pt-5">
        <Button variant="outline" asChild>
          <Link to="/builds">{t("common.cancel")}</Link>
        </Button>
        <Button
          type="button"
          onClick={handleSave}
          disabled={saving || !isBuildComplete(slots)}
        >
          {saving
            ? t("build.saving")
            : mode === "create"
              ? t("build.saveBuild")
              : t("build.updateBuild")}
        </Button>
      </div>
    </>
  );
}

function CategorySectionWithQuery({
  meta,
  classId,
  slots,
  usedItemIds,
  activeSlot,
  onSlotClick,
  onItemSelect,
  onSlotClear,
  onSlotReorder,
  getItemById,
  className,
}: {
  meta: (typeof CATEGORIES)[number];
  classId?: Id<"classes">;
  slots: (string | null)[];
  usedItemIds: ReadonlySet<string>;
  activeSlot: number | null;
  onSlotClick: (index: number) => void;
  onItemSelect: (item: GameItem) => void;
  onSlotClear: (index: number) => void;
  onSlotReorder?: (fromIndex: number, toIndex: number) => void;
  getItemById: (id: string) => GameItem | undefined;
  className?: string;
}) {
  const { t } = useTranslation();
  const items = useQuery(api.slotPicker.listByClassAndCategory, {
    classId,
    category: meta.key,
  });

  if (items === undefined) {
    return (
      <FantasyCard className="mb-6">
        <CardContent className="py-8">
          <LoadingState>
            {t("build.loadingCategory", { category: t(`categories.${meta.key}.label`) })}
          </LoadingState>
        </CardContent>
      </FantasyCard>
    );
  }

  const gameItems = items.map((item) => fromSlotPickerRow(item, meta.key));

  const mergedGetItemById = (id: string) =>
    getItemById(id) ?? gameItems.find((i) => i.id === id);

  return (
    <CategorySection
      meta={meta}
      items={gameItems}
      slots={slots}
      usedItemIds={usedItemIds}
      activeSlot={activeSlot}
      onSlotClick={onSlotClick}
      onItemSelect={onItemSelect}
      onSlotClear={onSlotClear}
      onSlotReorder={onSlotReorder}
      getItemById={mergedGetItemById}
      className={className}
    />
  );
}
