import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type AppLanguage } from "@/i18n";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onValueChange={(value) => void i18n.changeLanguage(value as AppLanguage)}
    >
      <SelectTrigger
        className="h-8 w-[7.5rem] border-gold-muted/60 font-display text-[10px] tracking-widest uppercase"
        aria-label={t("lang.label")}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map((code) => (
          <SelectItem key={code} value={code} className="font-display text-xs tracking-wider uppercase">
            {t(`lang.${code}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
