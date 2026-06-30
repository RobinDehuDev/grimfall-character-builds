import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AdminShowHiddenToggleProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id?: string;
}

export function AdminShowHiddenToggle({
  checked,
  onCheckedChange,
  id = "admin-show-hidden",
}: AdminShowHiddenToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id}>{t("admin.showHidden")}</Label>
    </div>
  );
}
