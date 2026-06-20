import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { itemMatchesSearch } from "../../convex/lib/itemSearch";
import {
  fromConvexAbility,
  fromConvexCapstone,
  fromConvexRunicEnhancement,
  fromConvexTalent,
  type GameItem,
} from "../lib/types";
import { ItemCard } from "../components/items/ItemCard";
import { PageHeader, LoadingState, EmptyState } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FantasyCard,
  CardContent,
} from "@/components/ui/fantasy-card";

type SelectedItem = GameItem & {
  kind: "ability" | "capstone" | "talent" | "runicEnhancement";
};

export function BugReportPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const abilities = useQuery(api.abilities.list, {});
  const talents = useQuery(api.talents.list, {});
  const capstones = useQuery(api.capstones.list, {});
  const runics = useQuery(api.runicEnhancements.list, {});
  const createReport = useMutation(api.bugReports.create);

  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const allItems = useMemo(() => {
    if (
      abilities === undefined ||
      capstones === undefined ||
      talents === undefined ||
      runics === undefined
    ) {
      return undefined;
    }
    return [
      ...abilities.map((item) => ({ ...fromConvexAbility(item), kind: "ability" as const })),
      ...capstones.map((item) => ({ ...fromConvexCapstone(item), kind: "capstone" as const })),
      ...talents.map((item) => ({ ...fromConvexTalent(item), kind: "talent" as const })),
      ...runics.map((item) => ({
        ...fromConvexRunicEnhancement(item),
        kind: "runicEnhancement" as const,
      })),
    ];
  }, [abilities, capstones, talents, runics]);

  const filteredItems = (allItems ?? [])
    .filter((item) => {
      const q = search.trim();
      if (!q) return true;
      return itemMatchesSearch(
        {
          name: item.name,
          description: item.description,
          tags: "tags" in item ? item.tags : undefined,
        },
        q,
      );
    })
    .slice(0, 20);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError(t("bugReport.errorMessageRequired"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createReport({
        relatedItemKind: selectedItem?.kind,
        relatedItemId: selectedItem?.id,
        message: message.trim(),
      });
      setSuccess(true);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("bugReport.errorSubmitFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (allItems === undefined) {
    return <LoadingState />;
  }

  if (success) {
    return (
      <EmptyState>
        {t("bugReport.success")}
      </EmptyState>
    );
  }

  return (
    <>
      <PageHeader
        title={t("bugReport.title")}
        description={t("bugReport.description")}
      />

      <form onSubmit={handleSubmit} className="max-w-xl">
        <FantasyCard>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="item-search">{t("bugReport.itemLabel")}</Label>
              <Input
                id="item-search"
                type="search"
                placeholder={t("bugReport.itemSearchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <div className="mt-2 flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      selected={selectedItem?.id === item.id}
                      onClick={() => {
                        setSelectedItem(item);
                        setSearch(item.name);
                      }}
                    />
                  ))}
                </div>
              )}
              {selectedItem && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedItem(null);
                    setSearch("");
                  }}
                >
                  {t("bugReport.clearSelection")}
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bug-message">{t("bugReport.messageLabel")}</Label>
              <Textarea
                id="bug-message"
                placeholder={t("bugReport.messagePlaceholder")}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={saving}>
              {saving ? t("bugReport.submitting") : t("bugReport.submit")}
            </Button>
          </CardContent>
        </FantasyCard>
      </form>
    </>
  );
}
