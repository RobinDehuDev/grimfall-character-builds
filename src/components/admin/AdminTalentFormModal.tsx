import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  emptyTalentForm,
  formToTalentArgs,
  talentToForm,
  type TalentFormState,
} from "@/lib/adminItemForms";
import type { TalentGameItem } from "@/lib/types";
import { AdminFormModalShell } from "./AdminFormModalShell";
import { AdminHiddenField } from "./AdminHiddenField";
import { AdminTalentEffectsEditor } from "./AdminTalentEffectsEditor";
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

interface AdminTalentFormModalProps {
  open: boolean;
  item: TalentGameItem | null;
  defaultWotlkClass?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function AdminTalentFormModal({
  open,
  item,
  defaultWotlkClass = "mage",
  onClose,
  onSaved,
}: AdminTalentFormModalProps) {
  const { t } = useTranslation();
  const talentClasses = useQuery(api.talents.listTalentClasses);
  const createTalent = useMutation(api.talents.create);
  const updateTalent = useMutation(api.talents.update);
  const removeTalent = useMutation(api.talents.remove);

  const [form, setForm] = useState<TalentFormState>(() =>
    emptyTalentForm(defaultWotlkClass),
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(item ? talentToForm(item) : emptyTalentForm(defaultWotlkClass));
  }, [open, item, defaultWotlkClass]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.treeName.trim() || !form.icon.trim()) return;
    setSaving(true);
    try {
      const args = formToTalentArgs(form);
      if (item) {
        await updateTalent({ id: item.id as Id<"talents">, ...args });
      } else {
        await createTalent(args);
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
      await removeTalent({ id: item.id as Id<"talents"> });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormModalShell
      key={item?.id ?? "create"}
      open={open}
      title={item ? t("admin.editTalent") : t("admin.addTalent")}
      titleId="admin-talent-form-title"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={item ? t("common.update") : t("common.add")}
      className="w-full max-w-3xl max-h-[90vh] overflow-y-auto"
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label>{t("common.name")}</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{t("common.description")}</Label>
          <Textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
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
          <Label>{t("admin.levelRequirement")}</Label>
          <Input
            type="number"
            min={0}
            value={form.levelRequirement}
            onChange={(e) =>
              setForm({ ...form, levelRequirement: Number(e.target.value) })
            }
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.treeName")}</Label>
          <Input
            value={form.treeName}
            onChange={(e) => setForm({ ...form, treeName: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.treeIndex")}</Label>
          <Input
            type="number"
            min={0}
            max={2}
            value={form.treeIndex}
            onChange={(e) =>
              setForm({ ...form, treeIndex: Number(e.target.value) })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.talentRow")}</Label>
          <Input
            type="number"
            min={1}
            value={form.row}
            onChange={(e) => setForm({ ...form, row: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.talentCol")}</Label>
          <Input
            type="number"
            min={1}
            value={form.col}
            onChange={(e) => setForm({ ...form, col: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label>{t("admin.talentIcon")}</Label>
          <Input
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
            placeholder="spell_fire_fireball"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.spellId")}</Label>
          <Input
            type="number"
            min={0}
            value={form.spellId}
            onChange={(e) => setForm({ ...form, spellId: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.externalId")}</Label>
          <Input
            value={form.externalId}
            onChange={(e) => setForm({ ...form, externalId: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <AdminHiddenField
            id="talent-hidden"
            checked={form.hidden}
            onCheckedChange={(hidden) => setForm({ ...form, hidden })}
          />
        </div>

        <AdminTalentEffectsEditor
          effects={form.effects}
          onChange={(effects) => setForm({ ...form, effects })}
        />
      </div>
    </AdminFormModalShell>
  );
}
