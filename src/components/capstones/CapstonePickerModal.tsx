import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { BUILD_SLOTS } from "@/lib/buildSlots";
import { Button } from "@/components/ui/button";
import { CapstoneGridCore } from "./CapstoneGridCore";
import { CapstoneSearchPanel } from "./CapstoneSearchPanel";
import type { SpellSearchResult } from "../talents/TalentSearchPanel";

interface CapstonePickerModalProps {
  open: boolean;
  onClose: () => void;
  selectedIds: ReadonlySet<string>;
  onSelectionChange: (ids: Set<string>) => void;
  maxSelections?: number;
  titleKey?: string;
}

export function CapstonePickerModal({
  open,
  onClose,
  selectedIds,
  onSelectionChange,
  maxSelections = BUILD_SLOTS.capstone,
  titleKey = "capstones.editCapstone",
}: CapstonePickerModalProps) {
  const { t } = useTranslation();
  const [draftIds, setDraftIds] = useState<Set<string>>(() => new Set());
  const [highlightCapstoneId, setHighlightCapstoneId] = useState<string | null>(
    null,
  );
  const selectedIdsRef = useRef(selectedIds);
  selectedIdsRef.current = selectedIds;

  useEffect(() => {
    if (open) {
      setDraftIds(new Set(selectedIdsRef.current));
      setHighlightCapstoneId(null);
    }
  }, [open]);

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

  const handleFindCapstone = useCallback((result: SpellSearchResult) => {
    setHighlightCapstoneId(result._id);
    window.setTimeout(() => setHighlightCapstoneId(null), 2500);
  }, []);

  const handleAddCapstone = useCallback(
    (capstoneId: string) => {
      setDraftIds((prev) => {
        const next = new Set(prev);
        if (next.has(capstoneId)) return prev;
        if (next.size >= maxSelections) next.clear();
        next.add(capstoneId);
        return next;
      });
    },
    [maxSelections],
  );

  const handleDone = () => {
    onSelectionChange(draftIds);
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="talent-modal-backdrop talent-picker-modal-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="talent-modal talent-picker-modal capstone-picker-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="capstone-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="talent-modal__header">
          <h2 id="capstone-modal-title" className="talent-modal__title">
            {t(titleKey)}
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

        <div className="talent-modal__body">
          <div className="talent-modal-layout capstone-modal-layout">
            <div className="talent-modal-layout__grid">
              <CapstoneGridCore
                selectedIds={draftIds}
                onSelectionChange={setDraftIds}
                highlightCapstoneId={highlightCapstoneId}
                maxSelections={maxSelections}
              />
            </div>
            <CapstoneSearchPanel
              selectedIds={draftIds}
              onFindCapstone={handleFindCapstone}
              onAddCapstone={handleAddCapstone}
            />
          </div>
        </div>

        <div className="talent-modal__footer">
          <Button type="button" onClick={handleDone}>
            {t("common.done")}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
