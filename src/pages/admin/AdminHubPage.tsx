import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

export function AdminHubPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t("admin.title")}
        description={t("admin.description")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link to="/admin/items" className="block no-underline transition-transform hover:-translate-y-0.5">
          <FantasyCard className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-sm text-gold">{t("admin.itemsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                {t("admin.itemsBody")}
              </p>
            </CardContent>
          </FantasyCard>
        </Link>
        <Link to="/admin/bug-reports" className="block no-underline transition-transform hover:-translate-y-0.5">
          <FantasyCard className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-sm text-gold">{t("admin.bugsTitle")}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{t("admin.bugsBody")}</p>
            </CardContent>
          </FantasyCard>
        </Link>
      </div>
    </>
  );
}
