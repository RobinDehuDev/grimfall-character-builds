import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { BuildPreviewCard } from "@/components/build/BuildPreviewCard";

export function MyBuildsPage() {
  const { t } = useTranslation();
  const builds = useQuery(api.builds.listMine);

  if (builds === undefined) {
    return <LoadingState>{t("myBuilds.loading")}</LoadingState>;
  }

  return (
    <>
      <PageHeader
        title={t("myBuilds.title")}
        description={t("myBuilds.description")}
      >
        <Button asChild>
          <Link to="/builds/new">{t("myBuilds.createNew")}</Link>
        </Button>
      </PageHeader>

      {builds.length === 0 ? (
        <EmptyState>{t("myBuilds.empty")}</EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => (
            <BuildPreviewCard
              key={build._id}
              to={`/builds/${build._id}`}
              title={build.title}
              meta={`${build.isPublic ? t("common.public") : t("common.private")}${
                build.description
                  ? ` · ${build.description.slice(0, 60)}${build.description.length > 60 ? "…" : ""}`
                  : ""
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
