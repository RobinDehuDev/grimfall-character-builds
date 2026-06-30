import { useTranslation } from "react-i18next";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface AdminHiddenFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  id: string;
}

export function AdminHiddenField({
  checked,
  onCheckedChange,
  id,
}: AdminHiddenFieldProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(value) => onCheckedChange(value === true)}
      />
      <Label htmlFor={id}>{t("admin.hidden")}</Label>
    </div>
  );
}
