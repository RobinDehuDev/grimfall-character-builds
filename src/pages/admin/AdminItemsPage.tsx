import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import {
  ITEM_TYPES,
  qualityColorClass,
  RUNIC_QUALITIES,
  slotCategoryColorClass,
  slotCategoryForItem,
  type ItemType,
  type RunicQuality,
} from "../../lib/categories";
import { WOTLK_CLASS_ORDER } from "../../lib/talents";
import {
  fromConvexAbility,
  fromConvexCapstone,
  fromConvexRunicEnhancement,
  fromConvexTalent,
  type GameItem,
} from "../../lib/types";
import { cn } from "@/lib/utils";
import { PageHeader, LoadingState } from "@/components/layout/PageHeader";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FantasyCard,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/fantasy-card";

type FormState = {
  type: ItemType;
  name: string;
  description: string;
  levelRequirement: number;
  wotlkClass: string;
  treeIndex: number;
  treeName: string;
  row: number;
  col: number;
  icon: string;
  spellId: string;
  externalId: string;
  rank: string;
  isPassive: boolean;
  castTime: string;
  cooldown: string;
  cost: string;
  range: string;
  schools: string;
  skillLineIds: string;
  quality: RunicQuality;
  mainAbility: Id<"abilities"> | "";
  otherAbilities: Id<"abilities">[];
};

type EditingTarget =
  | { table: "abilities"; id: Id<"abilities"> }
  | { table: "capstones"; id: Id<"capstones"> }
  | { table: "talents"; id: Id<"talents"> }
  | { table: "runicEnhancements"; id: Id<"runicEnhancements"> };

type AdminRow = GameItem;

const emptyForm = (): FormState => ({
  type: "talent",
  name: "",
  description: "",
  levelRequirement: 0,
  wotlkClass: "mage",
  treeIndex: 0,
  treeName: "",
  row: 1,
  col: 1,
  icon: "",
  spellId: "",
  externalId: "",
  rank: "",
  isPassive: false,
  castTime: "",
  cooldown: "",
  cost: "",
  range: "",
  schools: "",
  skillLineIds: "",
  quality: "uncommon",
  mainAbility: "",
  otherAbilities: [],
});

function itemColorClass(item: GameItem): string {
  if (item.type === "runicEnhancement") {
    return qualityColorClass(item.quality);
  }
  return slotCategoryColorClass(slotCategoryForItem(item));
}

export function AdminItemsPage() {
  const { t } = useTranslation();
  const talentClasses = useQuery(api.talents.listTalentClasses);
  const [filterWotlkClass, setFilterWotlkClass] = useState("");
  const [filterType, setFilterType] = useState<ItemType | "">("");
  const [filterQuality, setFilterQuality] = useState<RunicQuality | "">("");

  const abilities = useQuery(api.abilities.list, {
    wotlkClass: filterWotlkClass || undefined,
  });
  const capstones = useQuery(api.capstones.list, {
    wotlkClass: filterWotlkClass || undefined,
  });
  const allAbilities = useQuery(api.abilities.list, {});
  const talents = useQuery(api.talents.list, {
    wotlkClass: filterWotlkClass || undefined,
  });
  const runicEnhancements = useQuery(api.runicEnhancements.list, {
    quality: filterQuality || undefined,
  });

  const createCapstone = useMutation(api.capstones.create);
  const updateCapstone = useMutation(api.capstones.update);
  const removeCapstone = useMutation(api.capstones.remove);
  const createAbility = useMutation(api.abilities.create);
  const updateAbility = useMutation(api.abilities.update);
  const removeAbility = useMutation(api.abilities.remove);
  const createTalent = useMutation(api.talents.create);
  const updateTalent = useMutation(api.talents.update);
  const removeTalent = useMutation(api.talents.remove);
  const createRunic = useMutation(api.runicEnhancements.create);
  const updateRunic = useMutation(api.runicEnhancements.update);
  const removeRunic = useMutation(api.runicEnhancements.remove);

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingTarget, setEditingTarget] = useState<EditingTarget | null>(null);

  const items = useMemo(() => {
    if (
      abilities === undefined ||
      capstones === undefined ||
      talents === undefined ||
      runicEnhancements === undefined
    ) {
      return undefined;
    }

    const rows: AdminRow[] = [];
    if (!filterType || filterType === "ability") {
      rows.push(...abilities.map((item) => fromConvexAbility(item)));
    }
    if (!filterType || filterType === "capstone") {
      rows.push(...capstones.map((item) => fromConvexCapstone(item)));
    }
    if (!filterType || filterType === "talent") {
      rows.push(...talents.map((item) => fromConvexTalent(item)));
    }
    if (!filterType || filterType === "runicEnhancement") {
      rows.push(...runicEnhancements.map((item) => fromConvexRunicEnhancement(item)));
    }

    return rows.sort((a, b) => a.name.localeCompare(b.name));
  }, [abilities, capstones, talents, runicEnhancements, filterType]);

  if (
    talentClasses === undefined ||
    items === undefined ||
    allAbilities === undefined
  ) {
    return <LoadingState />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    if (form.type === "runicEnhancement") {
      const payload = {
        quality: form.quality,
        name: form.name.trim(),
        description: form.description.trim(),
        mainAbility: form.mainAbility ? form.mainAbility : null,
        otherAbilities: form.otherAbilities,
      };
      if (editingTarget?.table === "runicEnhancements") {
        await updateRunic({ id: editingTarget.id, ...payload });
      } else {
        await createRunic(payload);
      }
    } else if (form.type === "talent") {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        levelRequirement: form.levelRequirement,
        wotlkClass: form.wotlkClass,
        treeIndex: form.treeIndex,
        treeName: form.treeName.trim(),
        row: form.row,
        col: form.col,
        icon: form.icon.trim(),
        spellId: form.spellId ? Number(form.spellId) : undefined,
        externalId: form.externalId.trim() || undefined,
      };
      if (editingTarget?.table === "talents") {
        await updateTalent({ id: editingTarget.id, ...payload });
      } else {
        await createTalent(payload);
      }
    } else if (form.type === "capstone") {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        wotlkClass: form.wotlkClass.trim(),
        externalId: form.externalId.trim() || undefined,
        icon: form.icon.trim() || undefined,
      };
      if (editingTarget?.table === "capstones") {
        await updateCapstone({ id: editingTarget.id, ...payload, tags: [] });
      } else {
        await createCapstone(payload);
      }
    } else if (form.type === "ability") {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        wotlkClass: form.wotlkClass.trim(),
        levelRequirement: form.levelRequirement,
        externalId: form.externalId.trim() || undefined,
        icon: form.icon.trim() || undefined,
        spellId: form.spellId ? Number(form.spellId) : undefined,
        rank: form.rank ? Number(form.rank) : undefined,
        isPassive: form.isPassive || undefined,
        castTime: form.castTime.trim() || undefined,
        cooldown: form.cooldown.trim() || undefined,
        cost: form.cost.trim() || undefined,
        range: form.range.trim() || undefined,
        schools: form.schools ? Number(form.schools) : undefined,
        skillLineIds: form.skillLineIds
          ? form.skillLineIds
              .split(",")
              .map((part) => Number(part.trim()))
              .filter((n) => !Number.isNaN(n))
          : undefined,
      };
      if (editingTarget?.table === "abilities") {
        await updateAbility({ id: editingTarget.id, ...payload, tags: [] });
      } else {
        await createAbility(payload);
      }
    }

    setForm(emptyForm());
    setEditingTarget(null);
  };

  const startEdit = (item: AdminRow) => {
    if (item.type === "runicEnhancement") {
      setEditingTarget({
        table: "runicEnhancements",
        id: item.id as Id<"runicEnhancements">,
      });
      setForm({
        type: "runicEnhancement",
        name: item.name,
        description: item.description,
        levelRequirement: 0,
        wotlkClass: "mage",
        treeIndex: 0,
        treeName: "",
        row: 1,
        col: 1,
        icon: "",
        spellId: "",
        externalId: "",
        rank: "",
        isPassive: false,
        castTime: "",
        cooldown: "",
        cost: "",
        range: "",
        schools: "",
        skillLineIds: "",
        quality: item.quality,
        mainAbility: (item.mainAbility ?? "") as Id<"abilities"> | "",
        otherAbilities: item.otherAbilities as Id<"abilities">[],
      });
      return;
    }

    if (item.type === "talent") {
      setEditingTarget({ table: "talents", id: item.id as Id<"talents"> });
      setForm({
        type: "talent",
        name: item.name,
        description: item.description,
        levelRequirement: item.levelRequirement,
        wotlkClass: item.wotlkClass,
        treeIndex: item.treeIndex,
        treeName: item.treeName,
        row: item.row,
        col: item.col,
        icon: item.icon,
        spellId: item.spellId?.toString() ?? "",
        externalId: item.externalId ?? "",
        rank: "",
        isPassive: false,
        castTime: "",
        cooldown: "",
        cost: "",
        range: "",
        schools: "",
        skillLineIds: "",
        quality: "uncommon",
        mainAbility: "",
        otherAbilities: [],
      });
      return;
    }

    if (item.type === "capstone") {
      setEditingTarget({ table: "capstones", id: item.id as Id<"capstones"> });
      setForm({
        type: "capstone",
        name: item.name,
        description: item.description,
        levelRequirement: 0,
        wotlkClass: item.wotlkClass,
        treeIndex: 0,
        treeName: "",
        row: 1,
        col: 1,
        icon: item.icon ?? "",
        spellId: "",
        externalId: item.externalId ?? "",
        rank: "",
        isPassive: false,
        castTime: "",
        cooldown: "",
        cost: "",
        range: "",
        schools: "",
        skillLineIds: "",
        quality: "uncommon",
        mainAbility: "",
        otherAbilities: [],
      });
      return;
    }

    if (item.type === "ability") {
      setEditingTarget({ table: "abilities", id: item.id as Id<"abilities"> });
      setForm({
        type: "ability",
        name: item.name,
        description: item.description,
        levelRequirement: item.levelRequirement,
        wotlkClass: item.wotlkClass,
        treeIndex: 0,
        treeName: "",
        row: 1,
        col: 1,
        icon: item.icon ?? "",
        spellId: item.spellId?.toString() ?? "",
        externalId: item.externalId ?? "",
        rank: item.rank?.toString() ?? "",
        isPassive: item.isPassive ?? false,
        castTime: item.castTime ?? "",
        cooldown: item.cooldown ?? "",
        cost: item.cost ?? "",
        range: item.range ?? "",
        schools: item.schools?.toString() ?? "",
        skillLineIds: item.skillLineIds?.join(", ") ?? "",
        quality: "uncommon",
        mainAbility: "",
        otherAbilities: [],
      });
    }
  };

  const toggleOtherAbility = (abilityId: Id<"abilities">) => {
    setForm((prev) => ({
      ...prev,
      otherAbilities: prev.otherAbilities.includes(abilityId)
        ? prev.otherAbilities.filter((id) => id !== abilityId)
        : [...prev.otherAbilities, abilityId],
    }));
  };

  const isRunic = form.type === "runicEnhancement";

  return (
    <>
      <PageHeader
        title={t("admin.manageItems")}
        description={<Link to="/admin">{t("common.backToAdmin")}</Link>}
      />

      <form onSubmit={handleSubmit} className="mb-6">
        <FantasyCard>
          <CardHeader className="border-b border-gold-muted/40 pb-3">
            <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
              {editingTarget ? t("admin.editItem") : t("admin.addItem")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.itemType")}</Label>
                <Select
                  value={form.type}
                  disabled={!!editingTarget}
                  onValueChange={(v) =>
                    setForm({ ...emptyForm(), type: v as ItemType })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`itemTypes.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isRunic ? (
                <div className="space-y-2">
                  <Label>{t("admin.quality")}</Label>
                  <Select
                    value={form.quality}
                    onValueChange={(v) =>
                      setForm({ ...form, quality: v as RunicQuality })
                    }
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
              ) : null}

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
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              {!isRunic &&
                (form.type === "ability" ||
                  form.type === "capstone" ||
                  form.type === "talent") && (
                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("admin.wotlkClass")}</Label>
                    <Input
                      value={form.wotlkClass}
                      onChange={(e) =>
                        setForm({ ...form, wotlkClass: e.target.value })
                      }
                      placeholder="death-knight"
                      required
                    />
                  </div>
                )}

              {!isRunic && form.type === "talent" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("admin.treeName")}</Label>
                    <Input
                      value={form.treeName}
                      onChange={(e) =>
                        setForm({ ...form, treeName: e.target.value })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, row: Number(e.target.value) })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("admin.talentCol")}</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.col}
                      onChange={(e) =>
                        setForm({ ...form, col: Number(e.target.value) })
                      }
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
                      onChange={(e) =>
                        setForm({ ...form, spellId: e.target.value })
                      }
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
                </>
              )}

              {!isRunic && (form.type === "ability" || form.type === "talent") && (
                <div className="space-y-2">
                  <Label>{t("admin.levelRequirement")}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.levelRequirement}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        levelRequirement: Number(e.target.value),
                      })
                    }
                  />
                </div>
              )}

              {!isRunic && form.type === "ability" && (
                <>
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
                      onChange={(e) =>
                        setForm({ ...form, spellId: e.target.value })
                      }
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
                    <Label>Rank</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.rank}
                      onChange={(e) => setForm({ ...form, rank: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Schools</Label>
                    <Input
                      type="number"
                      value={form.schools}
                      onChange={(e) => setForm({ ...form, schools: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Skill line IDs</Label>
                    <Input
                      value={form.skillLineIds}
                      onChange={(e) =>
                        setForm({ ...form, skillLineIds: e.target.value })
                      }
                      placeholder="772, 770"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Cost</Label>
                    <Input
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Range</Label>
                    <Input
                      value={form.range}
                      onChange={(e) => setForm({ ...form, range: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cast time</Label>
                    <Input
                      value={form.castTime}
                      onChange={(e) =>
                        setForm({ ...form, castTime: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cooldown</Label>
                    <Input
                      value={form.cooldown}
                      onChange={(e) =>
                        setForm({ ...form, cooldown: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <input
                      id="ability-is-passive"
                      type="checkbox"
                      checked={form.isPassive}
                      onChange={(e) =>
                        setForm({ ...form, isPassive: e.target.checked })
                      }
                    />
                    <Label htmlFor="ability-is-passive">Passive</Label>
                  </div>
                </>
              )}

              {isRunic && (
                <>
                  <div className="space-y-2 md:col-span-2">
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
                        {allAbilities.map((ability) => (
                          <SelectItem key={ability._id} value={ability._id}>
                            {ability.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>{t("admin.otherAbilities")}</Label>
                    <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border p-2">
                      {allAbilities.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t("admin.noAbilitiesYet")}
                        </p>
                      ) : (
                        allAbilities.map((ability) => (
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
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button type="submit">
                {editingTarget ? t("common.update") : t("common.add")}
              </Button>
              {editingTarget && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingTarget(null);
                    setForm(emptyForm());
                  }}
                >
                  {t("common.cancel")}
                </Button>
              )}
            </div>
          </CardContent>
        </FantasyCard>
      </form>

      <FantasyCard>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b border-gold-muted/40 pb-3">
          <CardTitle className="font-display text-sm tracking-widest text-gold uppercase">
            {t("admin.itemsCount", { count: items.length })}
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select
              value={filterWotlkClass || "all"}
              onValueChange={(v) => setFilterWotlkClass(v === "all" ? "" : v)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder={t("admin.allClasses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allClasses")}</SelectItem>
                {WOTLK_CLASS_ORDER.map((slug) => {
                  const cls = talentClasses.find((c) => c.wotlkClass === slug);
                  return (
                    <SelectItem key={slug} value={slug}>
                      {cls?.name ?? slug}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>

            <Select
              value={filterType || "all"}
              onValueChange={(v) => {
                setFilterType(v === "all" ? "" : (v as ItemType));
                if (v !== "runicEnhancement") setFilterQuality("");
              }}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={t("admin.allTypes")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("admin.allTypes")}</SelectItem>
                {ITEM_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`itemTypes.${type}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(filterType === "runicEnhancement" || filterType === "") && (
              <Select
                value={filterQuality || "all"}
                onValueChange={(v) =>
                  setFilterQuality(v === "all" ? "" : (v as RunicQuality))
                }
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder={t("admin.allQualities")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("admin.allQualities")}</SelectItem>
                  {RUNIC_QUALITIES.map((quality) => (
                    <SelectItem key={quality} value={quality}>
                      {t(`itemTypes.qualities.${quality}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.name")}</TableHead>
                <TableHead>{t("admin.itemType")}</TableHead>
                <TableHead>{t("admin.details")}</TableHead>
                <TableHead>{t("common.actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className={cn("font-medium", itemColorClass(item))}>
                      {item.name}
                    </TableCell>
                    <TableCell>{t(`itemTypes.${item.type}`)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.type === "runicEnhancement" ? (
                        t(`itemTypes.qualities.${item.quality}`)
                      ) : item.type === "talent" ? (
                        `${item.wotlkClass} · ${item.treeName} (${item.row},${item.col})`
                      ) : item.type === "ability" && item.levelRequirement > 0 ? (
                        t("common.level", { level: item.levelRequirement })
                      ) : item.type === "ability" || item.type === "capstone" ? (
                        item.wotlkClass
                      ) : (
                        t("common.dash")
                      )}
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        {t("common.edit")}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (
                            confirm(t("admin.deleteItemConfirm", { name: item.name }))
                          ) {
                            if (item.type === "ability") {
                              void removeAbility({ id: item.id as Id<"abilities"> });
                            } else if (item.type === "capstone") {
                              void removeCapstone({ id: item.id as Id<"capstones"> });
                            } else if (item.type === "talent") {
                              void removeTalent({ id: item.id as Id<"talents"> });
                            } else {
                              void removeRunic({
                                id: item.id as Id<"runicEnhancements">,
                              });
                            }
                          }
                        }}
                      >
                        {t("common.delete")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </FantasyCard>
    </>
  );
}
