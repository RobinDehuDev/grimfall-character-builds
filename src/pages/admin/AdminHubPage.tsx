import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

const ITEM_CARDS = [
  { to: "/admin/abilities", titleKey: "admin.abilitiesTitle", bodyKey: "admin.abilitiesBody" },
  { to: "/admin/talents", titleKey: "admin.talentsTitle", bodyKey: "admin.talentsBody" },
  { to: "/admin/re", titleKey: "admin.reTitle", bodyKey: "admin.reBody" },
  { to: "/admin/capstones", titleKey: "admin.capstonesTitle", bodyKey: "admin.capstonesBody" },
] as const;

export function AdminHubPage() {
  const { t } = useTranslation();

  return (
    <>
      <PageHeader
        title={t("admin.title")}
        description={t("admin.description")}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ITEM_CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="block no-underline transition-transform hover:-translate-y-0.5"
          >
            <FantasyCard className="h-full">
              <CardHeader>
                <CardTitle className="font-display text-sm text-gold">
                  {t(card.titleKey)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{t(card.bodyKey)}</p>
              </CardContent>
            </FantasyCard>
          </Link>
        ))}
        <Link
          to="/admin/bug-reports"
          className="block no-underline transition-transform hover:-translate-y-0.5"
        >
          <FantasyCard className="h-full">
            <CardHeader>
              <CardTitle className="font-display text-sm text-gold">
                {t("admin.bugsTitle")}
              </CardTitle>
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
