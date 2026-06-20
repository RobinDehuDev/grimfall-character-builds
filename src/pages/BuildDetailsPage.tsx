import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { useAuth } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { CATEGORIES } from "../lib/categories";
import { useCategoryLabel } from "../lib/useCategoryLabel";
import { buildItemMap, type GameItem } from "../lib/types";
import { ItemCard } from "../components/items/ItemCard";
import { TalentGridPicker } from "../components/talents/TalentGridPicker";
import { getDraft } from "../hooks/useBuildDraft";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

function BuildCategorySection({
  categoryKey,
  ids,
  itemMap,
}: {
  categoryKey: (typeof CATEGORIES)[number]["key"];
  ids: string[];
  itemMap: Map<string, GameItem>;
}) {
  const { label } = useCategoryLabel(categoryKey);
  const meta = CATEGORIES.find((c) => c.key === categoryKey)!;

  return (
    <FantasyCard className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between border-b border-gold-muted/40 pb-3">
        <CardTitle
          className="font-display text-sm tracking-widest uppercase"
          style={{ color: meta.color }}
        >
          {label}
        </CardTitle>
        <Badge variant="secondary" className="shrink-0 rounded-full font-mono text-xs whitespace-nowrap">
          {ids.length}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ids.map((itemId) => {
            const item = itemMap.get(itemId);
            if (!item) return null;
            return <ItemCard key={itemId} item={item} />;
          })}
        </div>
      </CardContent>
    </FantasyCard>
  );
}

export function BuildDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const build = useQuery(api.builds.get, id ? { id: id as Id<"builds"> } : "skip");
  const removeBuild = useMutation(api.builds.remove);

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

  const draft = getDraft();
  const hasDraft = draft !== null;

  if (build === undefined) {
    return <LoadingState>{t("build.loadingBuild")}</LoadingState>;
  }

  if (build === null) {
    return <EmptyState>{t("build.notFound")}</EmptyState>;
  }

  const itemMap = resolvedItems ? buildItemMap(resolvedItems) : new Map<string, GameItem>();
  const isOwner = userId === build.userId;

  const slotGroups = [
    { key: "ability" as const, ids: build.abilities },
    { key: "talent" as const, ids: build.talents },
    { key: "capstone" as const, ids: build.capstone },
    { key: "legendary_re" as const, ids: build.legendaryRes },
    { key: "epic_re" as const, ids: build.epicRes },
    { key: "rare_re" as const, ids: build.rareRes },
    { key: "uncommon_re" as const, ids: build.uncommonRes },
  ];

  const handleDelete = async () => {
    if (!confirm(t("build.deleteConfirm"))) return;
    await removeBuild({ id: build._id });
    navigate("/builds/mine");
  };

  return (
    <>
      <PageHeader
        title={build.title}
        description={
          <>
            {build.className && (
              <Badge variant="secondary" className="mb-2 font-display tracking-widest uppercase">
                {build.className}
              </Badge>
            )}
            <span className="block">
              {t("common.byAuthor", { name: build.authorName })}
              {build.isPublic ? t("common.publicTag") : t("common.privateTag")}
            </span>
          </>
        }
      >
        {hasDraft && (
          <span title={t("common.workInProgress")}>
            <Button disabled>{t("build.compareToDraft")}</Button>
          </span>
        )}
        {isOwner && (
          <>
            <Button variant="outline" asChild>
              <Link to={`/builds/${build._id}/edit`}>{t("common.edit")}</Link>
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              {t("common.delete")}
            </Button>
          </>
        )}
      </PageHeader>

      {build.description && (
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          {build.description}
        </p>
      )}

      {!hasDraft && (
        <Alert className="mb-5 border-gold-muted/60 bg-primary/5">
          <AlertDescription>{t("build.compareHint")}</AlertDescription>
        </Alert>
      )}

      {slotGroups.map(({ key, ids }) =>
        key === "talent" ? (
          <TalentGridPicker
            key={key}
            selectedIds={new Set(ids)}
            onSelectionChange={() => {}}
            readOnly
          />
        ) : (
          <BuildCategorySection
            key={key}
            categoryKey={key}
            ids={ids}
            itemMap={itemMap}
          />
        ),
      )}
    </>
  );
}
