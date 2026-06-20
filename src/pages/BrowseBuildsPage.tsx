import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "convex/react";
import { useAuth } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { BuildPreviewCard } from "@/components/build/BuildPreviewCard";

export function BrowseBuildsPage() {
  const { t } = useTranslation();
  const builds = useQuery(api.builds.listPublic);
  const { isSignedIn } = useAuth();

  if (builds === undefined) {
    return <LoadingState>{t("browse.loading")}</LoadingState>;
  }

  return (
    <>
      <PageHeader
        title={t("browse.title")}
        description={t("browse.description")}
      />

      {builds.length === 0 ? (
        <EmptyState>
          <p>{t("browse.empty")}</p>
          {isSignedIn && (
            <Button asChild className="mt-4">
              <Link to="/builds/new">{t("browse.createFirst")}</Link>
            </Button>
          )}
        </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {builds.map((build) => (
            <BuildPreviewCard
              key={build._id}
              to={`/builds/${build._id}`}
              buildClass={build.className}
              title={build.title}
              meta={`${t("common.byAuthor", { name: build.authorName })}${
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
