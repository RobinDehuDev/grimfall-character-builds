import type { ItemCategory } from "./categories";
import { useTranslation } from "react-i18next";

export function useCategoryLabel(key: ItemCategory) {
  const { t } = useTranslation();
  return {
    label: t(`categories.${key}.label`),
    shortLabel: t(`categories.${key}.shortLabel`),
  };
}

export function useCategoryLabels() {
  const { t } = useTranslation();
  return (key: ItemCategory) => ({
    label: t(`categories.${key}.label`),
    shortLabel: t(`categories.${key}.shortLabel`),
  });
}
