import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { RUNIC_QUALITIES, type RunicQuality } from "@/lib/categories";
import {
  emptyREForm,
  formToREArgs,
  reToForm,
  type REFormState,
} from "@/lib/adminItemForms";
import type { RunicEnhancementGameItem } from "@/lib/types";
import { AdminFormModalShell } from "./AdminFormModalShell";
import { AdminHiddenField } from "./AdminHiddenField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminREFormModalProps {
  open: boolean;
  item: RunicEnhancementGameItem | null;
  defaultQuality?: RunicQuality;
  onClose: () => void;
  onSaved?: () => void;
}

export function AdminREFormModal({
  open,
  item,
  defaultQuality = "uncommon",
  onClose,
  onSaved,
}: AdminREFormModalProps) {
  const { t } = useTranslation();
  const allAbilities = useQuery(api.abilities.list, { includeHiddenItems: true });
  const createRunic = useMutation(api.runicEnhancements.create);
  const updateRunic = useMutation(api.runicEnhancements.update);
  const removeRunic = useMutation(api.runicEnhancements.remove);

  const [form, setForm] = useState<REFormState>(() => emptyREForm(defaultQuality));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(item ? reToForm(item) : emptyREForm(defaultQuality));
  }, [open, item, defaultQuality]);

  const toggleOtherAbility = (abilityId: Id<"abilities">) => {
    setForm((prev) => ({
      ...prev,
      otherAbilities: prev.otherAbilities.includes(abilityId)
        ? prev.otherAbilities.filter((id) => id !== abilityId)
        : [...prev.otherAbilities, abilityId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const args = formToREArgs(form);
      if (item) {
        await updateRunic({ id: item.id as Id<"runicEnhancements">, ...args });
      } else {
        await createRunic(args);
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(t("admin.deleteItemConfirm", { name: item.name }))) return;
    setSaving(true);
    try {
      await removeRunic({ id: item.id as Id<"runicEnhancements"> });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormModalShell
      open={open}
      title={item ? t("admin.editRE") : t("admin.addRE")}
      titleId="admin-re-form-title"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={item ? t("common.update") : t("common.add")}
      className="w-full max-w-lg"
      footerExtra={
        item ? (
          <Button
            type="button"
            variant="destructive"
            disabled={saving}
            onClick={() => void handleDelete()}
          >
            {t("common.delete")}
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t("admin.quality")}</Label>
          <Select
            value={form.quality}
            disabled={!!item}
            onValueChange={(v) => setForm({ ...form, quality: v as RunicQuality })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RUNIC_QUALITIES.map((quality) => (
                <SelectItem key={quality} value={quality}>
                  {t(`itemTypes.qualities.${quality}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("common.name")}</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("common.description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.mainAbility")}</Label>
          <Select
            value={form.mainAbility || "none"}
            onValueChange={(v) =>
              setForm({
                ...form,
                mainAbility: v === "none" ? "" : (v as Id<"abilities">),
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder={t("admin.noMainAbility")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("admin.noMainAbility")}</SelectItem>
              {(allAbilities ?? []).map((ability) => (
                <SelectItem key={ability._id} value={ability._id}>
                  {ability.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("admin.otherAbilities")}</Label>
          <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-2">
            {(allAbilities ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("admin.noAbilitiesYet")}
              </p>
            ) : (
              (allAbilities ?? []).map((ability) => (
                <label
                  key={ability._id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.otherAbilities.includes(ability._id)}
                    onChange={() => toggleOtherAbility(ability._id)}
                  />
                  {ability.name}
                </label>
              ))
            )}
          </div>
        </div>

        <AdminHiddenField
          id="re-hidden"
          checked={form.hidden}
          onCheckedChange={(hidden) => setForm({ ...form, hidden })}
        />
      </div>
    </AdminFormModalShell>
  );
}
