import { useTranslation } from "react-i18next";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";
import { LoadingState } from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";
import { TalentGridCore } from "./TalentPickerModal";

interface TalentGridPickerProps {
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  readOnly?: boolean;
  className?: string;
}

export function TalentGridPicker({
  selectedIds,
  onSelectionChange,
  readOnly = false,
  className,
}: TalentGridPickerProps) {
  const { t } = useTranslation();
  const maxTalents = BUILD_SLOTS.talent;

  return (
    <FantasyCard className={cn("mb-6", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-gold-muted/40 pb-3">
        <CardTitle
          className="font-display text-sm tracking-widest uppercase"
          style={{ color: "var(--quality-uncommon)" }}
        >
          {t("categories.talent.label")}
        </CardTitle>
        <span className="font-mono text-xs text-muted-foreground">
          {t("talents.counter", { count: selectedIds.size, max: maxTalents })}
        </span>
      </CardHeader>

      <CardContent className="pt-4">
        <TalentGridCore
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
          readOnly={readOnly}
          showSelectedStrip={!readOnly}
        />
      </CardContent>
    </FantasyCard>
  );
}

export function TalentGridPickerLoading({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <FantasyCard className={cn("mb-6", className)}>
      <CardContent className="py-8">
        <LoadingState>
          {t("build.loadingCategory", { category: t("categories.talent.label") })}
        </LoadingState>
      </CardContent>
    </FantasyCard>
  );
}
