import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Trans, useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { CATEGORIES } from "../../lib/categories";
import type { ItemCategory } from "../../lib/categories";
import { useCategoryLabel } from "../../lib/useCategoryLabel";
import { buildItemMap, type GameItem } from "../../lib/types";
import { itemMatchesSearch } from "../../../convex/lib/itemSearch";
import { getDraft } from "../../hooks/useBuildDraft";
import { ItemCard } from "../items/ItemCard";
import { TalentGridPicker } from "../talents/TalentGridPicker";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

export function ComparePage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const build = useQuery(api.builds.get, id ? { id: id as Id<"builds"> } : "skip");
  const draft = getDraft();

  const resolvedItems = useQuery(
    api.buildItems.resolveBuildItems,
    build
      ? {
          talentIds: build.talents,
          abilityIds: build.abilities,
          capstoneIds: build.capstone,
          runicEnhancementIds: [
            ...build.uncommonRes,
            ...build.rareRes,
            ...build.epicRes,
            ...build.legendaryRes,
          ],
        }
      : "skip",
  );

  if (build === undefined || resolvedItems === undefined) {
    return <LoadingState>{t("compare.loading")}</LoadingState>;
  }

  if (build === null) {
    return <EmptyState>{t("build.notFound")}</EmptyState>;
  }

  if (!draft) {
    return (
      <EmptyState>
        <p>{t("compare.noDraft")}</p>
        <Button asChild className="mt-4">
          <Link to="/builds/new">{t("compare.createBuild")}</Link>
        </Button>
      </EmptyState>
    );
  }

  const itemMap = buildItemMap(resolvedItems);

  const slotGroups: { key: ItemCategory; ids: string[] }[] = [
    { key: "ability", ids: build.abilities },
    { key: "talent", ids: build.talents },
    { key: "capstone", ids: build.capstone },
    { key: "legendary_re", ids: build.legendaryRes },
    { key: "epic_re", ids: build.epicRes },
    { key: "rare_re", ids: build.rareRes },
    { key: "uncommon_re", ids: build.uncommonRes },
  ];

  return (
    <>
      <PageHeader
        title={t("compare.title")}
        description={
          <>
            <Trans
              i18nKey="compare.description"
              values={{ title: build.title }}
              components={{ strong: <strong /> }}
            />{" "}
            <Link to={`/builds/${build._id}`}>{t("compare.backToBuild")}</Link>
          </>
        }
      />

      {slotGroups.map(({ key, ids }) =>
        key === "talent" ? (
          <FantasyCard key={key} className="mb-4">
            <CardHeader className="border-b border-gold-muted/40 pb-3">
              <CardTitle
                className="font-display text-sm tracking-widest uppercase"
                style={{ color: CATEGORIES.find((c) => c.key === "talent")!.color }}
              >
                {t("categories.talent.label")}
              </CardTitle>
            </CardHeader>
            <CardContent className="compare-grid pt-4">
              <div>
                <Label className="mb-2 block">
                  {t("compare.inBuild", {
                    category: t("categories.talent.shortLabel"),
                  })}
                </Label>
                <TalentGridPicker
                  selectedIds={new Set(ids)}
                  onSelectionChange={() => {}}
                  readOnly
                  className="mb-0"
                />
              </div>
              <div>
                <Label className="mb-2 block">{t("compare.inYourDraft")}</Label>
                <TalentGridPicker
                  selectedIds={new Set(draft.slots.talent.filter(Boolean) as string[])}
                  onSelectionChange={() => {}}
                  readOnly
                  className="mb-0"
                />
              </div>
            </CardContent>
          </FantasyCard>
        ) : (
          <CompareCategoryPanel
            key={key}
            category={key}
            viewedItemIds={ids}
            draftItemIds={(draft.slots[key].filter(Boolean) as string[])}
            itemMap={itemMap}
          />
        ),
      )}
    </>
  );
}

function CompareCategoryPanel({
  category,
  viewedItemIds,
  draftItemIds,
  itemMap,
}: {
  category: ItemCategory;
  viewedItemIds: string[];
  draftItemIds: string[];
  itemMap: Map<string, GameItem>;
}) {
  const { t } = useTranslation();
  const { label } = useCategoryLabel(category);
  const [search, setSearch] = useState("");
  const meta = CATEGORIES.find((c) => c.key === category)!;
  const draftSet = new Set(draftItemIds);

  const viewedItems = viewedItemIds
    .map((id) => itemMap.get(id))
    .filter((i) => i !== undefined);

  const draftOnlyIds = draftItemIds.filter((id) => !viewedItemIds.includes(id));
  const draftOnlyItems = draftOnlyIds
    .map((id) => itemMap.get(id))
    .filter((i) => i !== undefined);

  const q = search.trim();
  const filterItem = (item: GameItem) => {
    if (!q) return true;
    return itemMatchesSearch(
      {
        name: item.name,
        description: item.description,
        tags: "tags" in item ? item.tags : undefined,
      },
      q,
    );
  };

  const filteredViewed = viewedItems.filter(filterItem);
  const filteredDraftOnly = draftOnlyItems.filter(filterItem);

  const matchCount = viewedItemIds.filter((id) => draftSet.has(id)).length;

  return (
    <FantasyCard className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gold-muted/40 pb-3">
        <CardTitle className="font-display text-sm tracking-widest uppercase" style={{ color: meta.color }}>
          {label}
        </CardTitle>
        <Badge variant="secondary" className="shrink-0 rounded-full font-mono text-xs whitespace-nowrap">
          {t("compare.matching", { match: matchCount, total: viewedItemIds.length })}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="mb-3 space-y-2">
          <Label htmlFor={`compare-search-${category}`} className="sr-only">
            {t("common.search")}
          </Label>
          <Input
            id={`compare-search-${category}`}
            type="search"
            placeholder={t("build.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="compare-grid">
          <div>
            <Label className="mb-2 block">
              {t("compare.inBuild", {
                category: t(`categories.${category}.shortLabel`),
              })}
            </Label>
            <div className="compare-items">
              {filteredViewed.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("compare.noItems")}
                </p>
              ) : (
                filteredViewed.map((item) => {
                  const inDraft = draftSet.has(item.id);
                  return (
                    <div
                      key={item.id}
                      className={`compare-item ${inDraft ? "compare-item--match" : "compare-item--missing"}`}
                    >
                      <ItemCard item={item} />
                      <span className="compare-item__badge">
                        {inDraft ? t("compare.inYourDraft") : t("compare.missingFromDraft")}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {filteredDraftOnly.length > 0 && (
            <div>
              <Label className="mb-2 block">{t("compare.draftOnly")}</Label>
              <div className="compare-items">
                {filteredDraftOnly.map((item) => (
                  <div key={item.id} className="compare-item compare-item--extra">
                    <ItemCard item={item} />
                    <span className="compare-item__badge">{t("compare.draftOnlyBadge")}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </FantasyCard>
  );
}
