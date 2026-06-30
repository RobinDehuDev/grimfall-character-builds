import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  capstoneToForm,
  emptyCapstoneForm,
  formToCapstoneArgs,
  type CapstoneFormState,
} from "@/lib/adminItemForms";
import type { CapstoneGameItem } from "@/lib/types";
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

interface AdminCapstoneFormModalProps {
  open: boolean;
  item: CapstoneGameItem | null;
  defaultWotlkClass?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function AdminCapstoneFormModal({
  open,
  item,
  defaultWotlkClass = "mage",
  onClose,
  onSaved,
}: AdminCapstoneFormModalProps) {
  const { t } = useTranslation();
  const talentClasses = useQuery(api.talents.listTalentClasses);
  const createCapstone = useMutation(api.capstones.create);
  const updateCapstone = useMutation(api.capstones.update);
  const removeCapstone = useMutation(api.capstones.remove);

  const [form, setForm] = useState<CapstoneFormState>(() =>
    emptyCapstoneForm(defaultWotlkClass),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(item ? capstoneToForm(item) : emptyCapstoneForm(defaultWotlkClass));
  }, [open, item, defaultWotlkClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const args = formToCapstoneArgs(form);
      if (item) {
        await updateCapstone({ id: item.id as Id<"capstones">, ...args });
      } else {
        await createCapstone(args);
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
      await removeCapstone({ id: item.id as Id<"capstones"> });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormModalShell
      open={open}
      title={item ? t("admin.editCapstone") : t("admin.addCapstone")}
      titleId="admin-capstone-form-title"
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
          <Label>{t("admin.wotlkClass")}</Label>
          <Select
            value={form.wotlkClass}
            onValueChange={(v) => setForm({ ...form, wotlkClass: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(talentClasses ?? []).map((c) => (
                <SelectItem key={c.wotlkClass} value={c.wotlkClass!}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("admin.talentIcon")}</Label>
          <Input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="spell_nature_starfall"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.externalId")}</Label>
          <Input
            value={form.externalId}
            onChange={(e) => setForm({ ...form, externalId: e.target.value })}
          />
        </div>

        <AdminHiddenField
          id="capstone-hidden"
          checked={form.hidden}
          onCheckedChange={(hidden) => setForm({ ...form, hidden })}
        />
      </div>
    </AdminFormModalShell>
  );
}
