import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useTranslation } from "react-i18next";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  abilityToForm,
  emptyAbilityForm,
  formToAbilityArgs,
  type AbilityFormState,
} from "@/lib/adminItemForms";
import type { AbilityGameItem } from "@/lib/types";
import { normalizeAbilityWotlkClass } from "@/lib/wotlkClasses";
import { AdminFormModalShell } from "./AdminFormModalShell";
import { AdminHiddenField } from "./AdminHiddenField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

interface AdminAbilityFormModalProps {
  open: boolean;
  item: AbilityGameItem | null;
  defaultWotlkClass?: string;
  onClose: () => void;
  onSaved?: () => void;
}

export function AdminAbilityFormModal({
  open,
  item,
  defaultWotlkClass = "mage",
  onClose,
  onSaved,
}: AdminAbilityFormModalProps) {
  const { t } = useTranslation();
  const abilityClasses = useQuery(api.abilities.listAbilityClasses);
  const createAbility = useMutation(api.abilities.create);
  const updateAbility = useMutation(api.abilities.update);
  const removeAbility = useMutation(api.abilities.remove);

  const [form, setForm] = useState<AbilityFormState>(() =>
    item
      ? abilityToForm(item, defaultWotlkClass)
      : emptyAbilityForm(defaultWotlkClass),
  );
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const args = formToAbilityArgs(form);
      if (item) {
        await updateAbility({ id: item.id as Id<"abilities">, ...args });
      } else {
        await createAbility(args);
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
      await removeAbility({ id: item.id as Id<"abilities"> });
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminFormModalShell
      open={open}
      title={item ? t("admin.editAbility") : t("admin.addAbility")}
      titleId="admin-ability-form-title"
      onClose={onClose}
      onSubmit={handleSubmit}
      saving={saving}
      submitLabel={item ? t("common.update") : t("common.add")}
      className="w-full max-w-2xl"
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
            value={normalizeAbilityWotlkClass(form.wotlkClass)}
            onValueChange={(v) => setForm({ ...form, wotlkClass: v })}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={item ? undefined : t("admin.wotlkClass")}
              />
            </SelectTrigger>
            <SelectContent>
              {(abilityClasses ?? []).map((c) => (
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
          <Label>{t("admin.subclass")}</Label>
          <Input
            value={form.treeName}
            onChange={(e) => setForm({ ...form, treeName: e.target.value })}
            placeholder="Blood"
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.treeIndex")}</Label>
          <Input
            type="number"
            min={0}
            max={2}
            value={form.treeIndex}
            onChange={(e) => setForm({ ...form, treeIndex: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.talentRow")}</Label>
          <Input
            type="number"
            min={1}
            value={form.row}
            onChange={(e) => setForm({ ...form, row: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("admin.talentCol")}</Label>
          <Input
            type="number"
            min={1}
            value={form.col}
            onChange={(e) => setForm({ ...form, col: e.target.value })}
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 md:col-span-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="ability-is-passive"
              checked={form.isPassive}
              onCheckedChange={(value) =>
                setForm({ ...form, isPassive: value === true })
              }
            />
            <Label htmlFor="ability-is-passive">{t("admin.isPassive")}</Label>
          </div>

          <AdminHiddenField
            id="ability-hidden"
            checked={form.hidden}
            onCheckedChange={(hidden) => setForm({ ...form, hidden })}
          />

          <div className="flex items-center gap-2">
            <Checkbox
              id="ability-added-from-wowhead"
              checked={form.addedFromWowhead}
              onCheckedChange={(value) =>
                setForm({ ...form, addedFromWowhead: value === true })
              }
            />
            <Label htmlFor="ability-added-from-wowhead">
              {t("admin.addedFromWowhead")}
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="ability-probably-talent"
              checked={form.probablyTalent}
              onCheckedChange={(value) =>
                setForm({ ...form, probablyTalent: value === true })
              }
            />
            <Label htmlFor="ability-probably-talent">
              {t("admin.probablyTalent")}
            </Label>
          </div>
        </div>

        <details className="group md:col-span-2 rounded-md border border-border">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("admin.showAdditionalInformation")}
          </summary>
          <div className="grid grid-cols-1 gap-4 border-t border-border p-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2">
              <Label>{t("admin.talentIcon")}</Label>
              <Input
                value={form.icon}
                onChange={(e) => setForm({ ...form, icon: e.target.value })}
                placeholder="spell_deathknight_icetouch"
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
                onChange={(e) =>
                  setForm({ ...form, externalId: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.rank")}</Label>
              <Input
                type="number"
                min={1}
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.schools")}</Label>
              <Input
                type="number"
                value={form.schools}
                onChange={(e) => setForm({ ...form, schools: e.target.value })}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>{t("admin.skillLineIds")}</Label>
              <Input
                value={form.skillLineIds}
                onChange={(e) =>
                  setForm({ ...form, skillLineIds: e.target.value })
                }
                placeholder="772, 770"
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.cost")}</Label>
              <Input
                value={form.cost}
                onChange={(e) => setForm({ ...form, cost: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.range")}</Label>
              <Input
                value={form.range}
                onChange={(e) => setForm({ ...form, range: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.castTime")}</Label>
              <Input
                value={form.castTime}
                onChange={(e) =>
                  setForm({ ...form, castTime: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>{t("admin.cooldown")}</Label>
              <Input
                value={form.cooldown}
                onChange={(e) =>
                  setForm({ ...form, cooldown: e.target.value })
                }
              />
            </div>
          </div>
        </details>
      </div>
    </AdminFormModalShell>
  );
}
