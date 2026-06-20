import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation } from "convex/react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChangeNicknameModalProps {
  open: boolean;
  currentNickname: string;
  onClose: () => void;
}

export function ChangeNicknameModal({
  open,
  currentNickname,
  onClose,
}: ChangeNicknameModalProps) {
  const { t } = useTranslation();
  const updateNickname = useMutation(api.users.updateNickname);
  const [nickname, setNickname] = useState(currentNickname);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setNickname(currentNickname);
      setError(null);
    }
  }, [open, currentNickname]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = nickname.trim();
    if (!trimmed) {
      setError(t("auth.nicknameRequired"));
      return;
    }

    setSaving(true);
    try {
      await updateNickname({ name: trimmed });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("auth.nicknameSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return createPortal(
    <div
      className="app-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="app-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="change-nickname-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="app-modal__header">
          <h2 id="change-nickname-title" className="app-modal__title">
            {t("auth.changeNicknameTitle")}
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

        <form onSubmit={handleSubmit}>
          <div className="app-modal__body space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-nickname">{t("auth.newNicknameLabel")}</Label>
              <Input
                id="new-nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder={t("auth.newNicknamePlaceholder")}
                autoComplete="off"
                maxLength={50}
                autoFocus
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="app-modal__footer">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? t("common.loading") : t("common.update")}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  );
}
