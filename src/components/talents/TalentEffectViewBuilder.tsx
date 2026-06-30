import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  persistTabs,
  SCHOOL_SCOPED_SUBCATEGORIES,
  tabKey,
  type EffectViewTab,
} from "@/lib/talentEffectView";
import {
  categoryLabel,
  schoolLabel,
  subcategoryOptionsForCategory,
  TALENT_EFFECT_CATEGORIES,
  TALENT_EFFECT_SCHOOLS,
} from "@/lib/talentEffectForm";

interface TalentEffectViewBuilderProps {
  persistKey: string;
  selectedCategory: string;
  onSelectedCategoryChange: (category: string) => void;
  tabs: EffectViewTab[];
  onTabsChange: (tabs: EffectViewTab[]) => void;
}

export function TalentEffectViewBuilder({
  persistKey,
  selectedCategory,
  onSelectedCategoryChange,
  tabs,
  onTabsChange,
}: TalentEffectViewBuilderProps) {
  const { t } = useTranslation();
  const tabKeySet = new Set(tabs.map(tabKey));
  const subcategoryOptions = subcategoryOptionsForCategory(selectedCategory);

  const setTabChecked = (category: string, subcategory: string, checked: boolean) => {
    const key = tabKey({ category, subcategory });
    let next: EffectViewTab[];
    if (checked) {
      if (tabKeySet.has(key)) return;
      next = [...tabs, { category, subcategory }];
    } else {
      next = tabs.filter((tab) => tabKey(tab) !== key);
    }
    onTabsChange(next);
    persistTabs(next, persistKey);
  };

  const setSchoolTabChecked = (
    category: string,
    subcategory: string,
    school: string,
    checked: boolean,
  ) => {
    const key = tabKey({ category, subcategory, school });
    let next: EffectViewTab[];
    if (checked) {
      if (tabKeySet.has(key)) return;
      next = [...tabs, { category, subcategory, school }];
    } else {
      next = tabs.filter((tab) => tabKey(tab) !== key);
    }
    onTabsChange(next);
    persistTabs(next, persistKey);
  };

  const resetAllTabs = () => {
    onTabsChange([]);
    persistTabs([], persistKey);
  };

  return (
    <section className="talent-effect-picker__builder">
      <div className="talent-effect-picker__builder-header">
        <h2 className="talent-effect-picker__builder-title">
          {t("talents.effectView.builderTitle")}
        </h2>
        <Button type="button" variant="outline" size="sm" onClick={resetAllTabs}>
          {t("talents.effectView.resetAllTabs")}
        </Button>
      </div>

      <div className="talent-effect-picker__builder-controls">
        <div className="space-y-2">
          <Label>{t("talents.effectView.effectCategory")}</Label>
          <Select value={selectedCategory} onValueChange={onSelectedCategoryChange}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TALENT_EFFECT_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabel(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="talent-effect-picker__builder-checkboxes">
          {subcategoryOptions.map((sub) => {
            if (SCHOOL_SCOPED_SUBCATEGORIES.has(sub.id)) {
              return (
                <fieldset
                  key={sub.id}
                  className="talent-effect-picker__school-group"
                >
                  <legend className="talent-effect-picker__school-legend">
                    {sub.label}
                  </legend>
                  <div className="talent-effect-picker__school-grid">
                    {TALENT_EFFECT_SCHOOLS.map((school) => {
                      const id = `subcat-${selectedCategory}-${sub.id}-${school}`;
                      const checked = tabKeySet.has(
                        tabKey({
                          category: selectedCategory,
                          subcategory: sub.id,
                          school,
                        }),
                      );
                      return (
                        <label
                          key={school}
                          htmlFor={id}
                          className="talent-effect-picker__checkbox"
                        >
                          <Checkbox
                            id={id}
                            checked={checked}
                            onCheckedChange={(value) =>
                              setSchoolTabChecked(
                                selectedCategory,
                                sub.id,
                                school,
                                value === true,
                              )
                            }
                          />
                          <span>{schoolLabel(school)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              );
            }

            const id = `subcat-${selectedCategory}-${sub.id}`;
            const checked = tabKeySet.has(
              tabKey({ category: selectedCategory, subcategory: sub.id }),
            );
            return (
              <label key={sub.id} htmlFor={id} className="talent-effect-picker__checkbox">
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={(value) =>
                    setTabChecked(selectedCategory, sub.id, value === true)
                  }
                />
                <span>{sub.label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </section>
  );
}
