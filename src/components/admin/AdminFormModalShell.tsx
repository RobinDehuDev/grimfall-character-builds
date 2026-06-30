import { useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AdminFormModalShellProps {
  open: boolean;
  title: string;
  titleId: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  saving?: boolean;
  submitLabel?: string;
  children: ReactNode;
  footerExtra?: ReactNode;
  className?: string;
}

export function AdminFormModalShell({
  open,
  title,
  titleId,
  onClose,
  onSubmit,
  saving = false,
  submitLabel,
  children,
  footerExtra,
  className,
}: AdminFormModalShellProps) {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="app-modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={cn("app-modal max-h-[90vh] flex flex-col", className)}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header shrink-0">
          <h2 id={titleId} className="app-modal__title">
            {title}
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="size-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="app-modal__body min-h-0 flex-1 overflow-y-auto space-y-4">
            {children}
          </div>

          <div className="app-modal__footer shrink-0">
            {footerExtra}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.loading") : (submitLabel ?? t("common.update"))}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
