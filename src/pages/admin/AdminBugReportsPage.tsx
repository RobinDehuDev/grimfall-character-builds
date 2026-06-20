import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

export function AdminBugReportsPage() {
  const { t } = useTranslation();
  const reports = useQuery(api.bugReports.list);
  const updateStatus = useMutation(api.bugReports.updateStatus);

  if (reports === undefined) {
    return <LoadingState />;
  }

  return (
    <>
      <PageHeader
        title={t("admin.bugReports")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      />

      <FantasyCard>
        <CardHeader className="border-b border-gold-muted/40 pb-3">
          <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
            {t("admin.reportsCount", { count: reports.length })}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {reports.length === 0 ? (
            <EmptyState>{t("admin.noReports")}</EmptyState>
          ) : (
            <div className="flex flex-col gap-3">
              {reports.map((report) => (
                <div
                  key={report._id}
                  className="rounded-md border border-gold-muted/40 bg-background p-4"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <Badge
                      variant={report.status === "open" ? "default" : "secondary"}
                      className="font-display tracking-widest uppercase"
                    >
                      {report.status === "open"
                        ? t("admin.statusOpen")
                        : t("admin.statusResolved")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {t("common.byAuthor", { name: report.reporterName })} ·{" "}
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {report.itemName && (
                    <div className="mb-1.5 text-sm text-quality-rare">
                      {t("admin.itemLabel", { name: report.itemName })}
                    </div>
                  )}
                  <p className="mb-3 text-sm leading-relaxed">{report.message}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      void updateStatus({
                        id: report._id as Id<"bugReports">,
                        status: report.status === "open" ? "resolved" : "open",
                      })
                    }
                  >
                    {report.status === "open"
                      ? t("admin.markResolved")
                      : t("admin.markOpen")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </FantasyCard>
    </>
  );
}
