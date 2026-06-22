import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@clerk/react";
import { useQuery } from "convex/react";
import { FileText, Hammer, Shield, Sword } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { BuildPreviewCard } from "@/components/build/BuildPreviewCard";
import { LoadingState } from "@/components/layout/PageHeader";
import {
  FantasyCard,
  CardContent,
} from "@/components/ui/fantasy-card";

export function LandingPage() {
  const { t } = useTranslation();
  const { isSignedIn } = useAuth();
  const builds = useQuery(api.builds.listPublic);
  const featured = builds?.slice(0, 3) ?? [];
  const forgeTo = isSignedIn ? "/builds/new" : "/login";

  return (
    <div className="space-y-10 pb-8">
      <FantasyCard className="mx-auto max-w-3xl px-6 py-12 text-center md:px-10 md:py-14">
        <CardContent className="p-0">
          <Sword className="mx-auto mb-6 size-10 text-gold" strokeWidth={1.25} />
          <h1 className="heading-gold mb-5 text-3xl font-semibold tracking-[0.15em] md:text-4xl">
            {t("landing.heroTitle")}
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {t("landing.heroBody")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild className="min-w-[160px]">
              <Link to={forgeTo}>{t("landing.forgeBuild")}</Link>
            </Button>
            <Button variant="outline" asChild className="min-w-[160px]">
              <Link to="/builds">{t("landing.browseShared")}</Link>
            </Button>
          </div>
        </CardContent>
      </FantasyCard>

      <section className="grid gap-4 md:grid-cols-3">
        <Link to="/builds" className="group block no-underline transition-transform hover:-translate-y-0.5">
          <FantasyCard className="h-full p-6 text-center">
            <CardContent className="p-0">
              <FileText className="mx-auto mb-4 size-8 text-gold transition-colors group-hover:text-primary" strokeWidth={1.25} />
              <h3 className="mb-2 font-display text-sm font-semibold tracking-widest text-gold uppercase">
                {t("landing.sharedTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("landing.sharedBody")}
              </p>
            </CardContent>
          </FantasyCard>
        </Link>

        <Link
          to={isSignedIn ? "/builds/mine" : "/login"}
          className="group block no-underline transition-transform hover:-translate-y-0.5"
        >
          <FantasyCard className="h-full p-6 text-center">
            <CardContent className="p-0">
              <Hammer className="mx-auto mb-4 size-8 text-gold transition-colors group-hover:text-primary" strokeWidth={1.25} />
              <h3 className="mb-2 font-display text-sm font-semibold tracking-widest text-gold uppercase">
                {t("landing.arsenalTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("landing.arsenalBody")}
              </p>
            </CardContent>
          </FantasyCard>
        </Link>

        <Link to="/builds" className="group block no-underline transition-transform hover:-translate-y-0.5">
          <FantasyCard className="h-full p-6 text-center">
            <CardContent className="p-0">
              <Shield className="mx-auto mb-4 size-8 text-gold transition-colors group-hover:text-primary" strokeWidth={1.25} />
              <h3 className="mb-2 font-display text-sm font-semibold tracking-widest text-gold uppercase">
                {t("landing.compareTitle")}
              </h3>
              <p className="text-xs leading-relaxed text-muted-foreground">
                {t("landing.compareBody")}
              </p>
            </CardContent>
          </FantasyCard>
        </Link>
      </section>

      {featured.length > 0 && (
        <section id="featured">
          <div className="mb-3 flex items-baseline justify-between gap-3 border-b border-gold-muted/40 pb-2">
            <h2 className="font-display text-base font-semibold text-gold">{t("landing.featuredTitle")}</h2>
            <Link to="/builds" className="font-mono text-xs text-muted-foreground hover:text-gold">
              {t("landing.viewAll")}
            </Link>
          </div>
          {builds === undefined ? (
            <LoadingState>{t("landing.loadingBuilds")}</LoadingState>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((build) => (
                <BuildPreviewCard
                  key={build._id}
                  to={`/builds/${build._id}`}
                  title={build.title}
                  meta={t("landing.featuredMeta", { author: build.authorName })}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
