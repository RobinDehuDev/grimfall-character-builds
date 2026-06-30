import { useTranslation } from "react-i18next";
import { Plus, Trash2 } from "lucide-react";
import type { TalentEffect } from "@/lib/talentEffectForm";
import {
  emptyTalentEffect,
  spellIdsFromString,
  spellIdsToString,
  spellNamesFromString,
  spellNamesToString,
  statsForSubcategory,
  subcategoriesForCategory,
  TALENT_EFFECT_ATTACK_TYPES,
  TALENT_EFFECT_CATEGORIES,
  TALENT_EFFECT_SCHOOLS,
  TYPE_OF_EFFECT,
} from "@/lib/talentEffectForm";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface AdminTalentEffectsEditorProps {
  effects: TalentEffect[];
  onChange: (effects: TalentEffect[]) => void;
}

const NONE = "__none__";

function updateEffectAt(
  effects: TalentEffect[],
  index: number,
  patch: Partial<TalentEffect>,
): TalentEffect[] {
  return effects.map((effect, i) => (i === index ? { ...effect, ...patch } : effect));
}

export function AdminTalentEffectsEditor({
  effects,
  onChange,
}: AdminTalentEffectsEditorProps) {
  const { t } = useTranslation();

  const addEffect = () => {
    onChange([...effects, emptyTalentEffect()]);
  };

  const removeEffect = (index: number) => {
    onChange(effects.filter((_, i) => i !== index));
  };

  const patchEffect = (index: number, patch: Partial<TalentEffect>) => {
    onChange(updateEffectAt(effects, index, patch));
  };

  return (
    <div className="admin-talent-effects space-y-3 md:col-span-2">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-base">{t("admin.talentEffects")}</Label>
        <Button type="button" variant="outline" size="sm" onClick={addEffect}>
          <Plus className="size-4" />
          {t("admin.addEffect")}
        </Button>
      </div>

      {effects.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("admin.noEffectsYet")}</p>
      ) : null}

      {effects.map((effect, index) => {
        const subcategories = subcategoriesForCategory(effect.category);
        const stats = statsForSubcategory(effect.category, effect.subcategory);

        return (
          <div key={index} className="admin-talent-effects__card rounded-lg border p-3">
            <div className="mb-3 flex items-start justify-between gap-2">
              <p className="text-sm font-medium">
                {t("admin.effectNumber", { number: index + 1 })}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeEffect(index)}
                aria-label={t("admin.removeEffect")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label>{t("admin.effectCategory")}</Label>
                <Select
                  value={effect.category}
                  onValueChange={(category) => {
                    const subcategory = subcategoriesForCategory(category)[0] ?? "";
                    const stat = statsForSubcategory(category, subcategory)[0] ?? "";
                    patchEffect(index, { category, subcategory, stat });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TALENT_EFFECT_CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectSubcategory")}</Label>
                <Select
                  value={effect.subcategory}
                  onValueChange={(subcategory) => {
                    const stat = statsForSubcategory(effect.category, subcategory)[0] ?? effect.stat;
                    patchEffect(index, { subcategory, stat });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {subcategories.map((subcategory) => (
                      <SelectItem key={subcategory} value={subcategory}>
                        {subcategory}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectStat")}</Label>
                <Input
                  list={`talent-effect-stats-${index}`}
                  value={effect.stat}
                  onChange={(e) => patchEffect(index, { stat: e.target.value })}
                />
                <datalist id={`talent-effect-stats-${index}`}>
                  {stats.map((stat) => (
                    <option key={stat} value={stat} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectType")}</Label>
                <Select
                  value={effect.typeOfEffect}
                  onValueChange={(typeOfEffect) =>
                    patchEffect(index, {
                      typeOfEffect: typeOfEffect as TalentEffect["typeOfEffect"],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OF_EFFECT.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectValue")}</Label>
                <Input
                  type="number"
                  step="any"
                  value={effect.value ?? ""}
                  onChange={(e) =>
                    patchEffect(index, {
                      value:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectDuration")}</Label>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={effect.duration ?? ""}
                  onChange={(e) =>
                    patchEffect(index, {
                      duration:
                        e.target.value === "" ? undefined : Number(e.target.value),
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectScopeAttack")}</Label>
                <Select
                  value={effect.scope?.attackType ?? NONE}
                  onValueChange={(value) =>
                    patchEffect(index, {
                      scope: {
                        ...effect.scope,
                        attackType:
                          value === NONE
                            ? undefined
                            : (value as NonNullable<TalentEffect["scope"]>["attackType"]),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                    {TALENT_EFFECT_ATTACK_TYPES.map((attackType) => (
                      <SelectItem key={attackType} value={attackType}>
                        {attackType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{t("admin.effectScopeSchool")}</Label>
                <Select
                  value={effect.scope?.school ?? NONE}
                  onValueChange={(value) =>
                    patchEffect(index, {
                      scope: {
                        ...effect.scope,
                        school:
                          value === NONE
                            ? undefined
                            : (value as NonNullable<TalentEffect["scope"]>["school"]),
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t("common.none")}</SelectItem>
                    {TALENT_EFFECT_SCHOOLS.map((school) => (
                      <SelectItem key={school} value={school}>
                        {school}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t("admin.effectCondition")}</Label>
                <Textarea
                  value={effect.condition ?? ""}
                  onChange={(e) =>
                    patchEffect(index, {
                      condition: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-2 md:col-span-2">
                <Checkbox
                  id={`effect-recurrence-${index}`}
                  checked={effect.recurrence ?? false}
                  onCheckedChange={(checked) =>
                    patchEffect(index, {
                      recurrence: checked === true,
                      recurrenceInSeconds:
                        checked === true ? effect.recurrenceInSeconds : undefined,
                    })
                  }
                />
                <Label htmlFor={`effect-recurrence-${index}`}>
                  {t("admin.effectRecurrence")}
                </Label>
              </div>

              {effect.recurrence ? (
                <div className="space-y-2">
                  <Label>{t("admin.effectRecurrenceSeconds")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step="any"
                    value={effect.recurrenceInSeconds ?? ""}
                    onChange={(e) =>
                      patchEffect(index, {
                        recurrenceInSeconds:
                          e.target.value === ""
                            ? undefined
                            : Number(e.target.value),
                      })
                    }
                  />
                </div>
              ) : null}

              <div className="space-y-2 md:col-span-2">
                <Label>{t("admin.effectSpellNames")}</Label>
                <Input
                  value={spellNamesToString(effect.spellNames)}
                  onChange={(e) =>
                    patchEffect(index, {
                      spellNames: spellNamesFromString(e.target.value),
                    })
                  }
                  placeholder={t("admin.effectSpellNamesPlaceholder")}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>{t("admin.effectSpellIds")}</Label>
                <Input
                  value={spellIdsToString(effect.spellIds)}
                  onChange={(e) =>
                    patchEffect(index, {
                      spellIds: spellIdsFromString(e.target.value),
                    })
                  }
                  placeholder={t("admin.effectSpellIdsPlaceholder")}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
