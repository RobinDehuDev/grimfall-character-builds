import { useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

import { getItemSlotCategory, type GameItem } from "@/lib/types";
import {
  qualityColorClass,
  slotCategoryColorClass,
} from "@/lib/categories";

function itemColorClass(item: GameItem): string {
  if (item.type === "runicEnhancement") {
    return qualityColorClass(item.quality);
  }
  return slotCategoryColorClass(getItemSlotCategory(item));
}

interface NameDescriptionTooltipProps {
  name: string;
  description: string;
  className?: string;
}

function NameDescriptionTooltip({
  name,
  description,
  className,
}: NameDescriptionTooltipProps) {
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLDivElement>(null);

  const updateTipPosition = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTipPos({ x: rect.left, y: rect.bottom + 6 });
  };

  return (
    <>
      <div
        ref={anchorRef}
        className={className}
        onMouseEnter={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onBlur={() => setShowTip(false)}
        tabIndex={0}
      >
        <span className="block truncate">{name}</span>
      </div>

      {showTip &&
        description &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 max-w-sm rounded-md border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
            style={{ left: tipPos.x, top: tipPos.y }}
            role="tooltip"
          >
            {description}
          </div>,
          document.body,
        )}
    </>
  );
}

export function SpellSearchIconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-0",
        "text-muted-foreground transition-colors",
        "hover:bg-secondary/80 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        "disabled:pointer-events-none disabled:opacity-40",
      )}
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function SpellSearchResultRow({
  name,
  description,
  actions,
}: {
  name: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="spell-search-result-row flex min-w-0 items-center gap-0.5 rounded px-1.5 py-1 hover:bg-secondary/80">
      <NameDescriptionTooltip
        name={name}
        description={description}
        className={cn(
          "min-w-0 flex-1 px-1 text-left text-sm font-semibold text-foreground",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded",
        )}
      />
      {actions && (
        <div className="flex shrink-0 items-center gap-0.5">{actions}</div>
      )}
    </div>
  );
}

interface ItemPickerOptionProps {
  item: GameItem;
  onClick: () => void;
}

export function ItemPickerOption({ item, onClick }: ItemPickerOptionProps) {
  const { t } = useTranslation();
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const rowRef = useRef<HTMLButtonElement>(null);

  const updateTipPosition = () => {
    const rect = rowRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTipPos({ x: rect.left, y: rect.bottom + 6 });
  };

  return (
    <>
      <button
        ref={rowRef}
        type="button"
        className={cn(
          "w-full rounded px-2.5 py-1.5 text-left text-sm font-semibold transition-colors",
          "hover:bg-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          itemColorClass(item),
          item.hidden && "item-picker-option--hidden",
        )}
        onClick={onClick}
        onMouseEnter={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
        onFocus={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onBlur={() => setShowTip(false)}
      >
        <span className="block truncate">
          {item.name}
          {item.hidden ? ` · ${t("admin.hiddenItemBadge")}` : ""}
        </span>
      </button>

      {showTip &&
        item.description &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 max-w-sm rounded-md border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
            style={{ left: tipPos.x, top: tipPos.y }}
            role="tooltip"
          >
            {item.description}
          </div>,
          document.body,
        )}
    </>
  );
}

interface ItemNameTooltipProps {
  item: GameItem;
  className?: string;
  children: ReactNode;
}

export function ItemNameTooltip({ item, className, children }: ItemNameTooltipProps) {
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<HTMLSpanElement>(null);

  const updateTipPosition = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTipPos({ x: rect.left, y: rect.bottom + 6 });
  };

  return (
    <>
      <span
        ref={anchorRef}
        className={className}
        onMouseEnter={() => {
          updateTipPosition();
          setShowTip(true);
        }}
        onMouseLeave={() => setShowTip(false)}
      >
        {children}
      </span>

      {showTip &&
        item.description &&
        createPortal(
          <div
            className="pointer-events-none fixed z-50 max-w-sm rounded-md border border-border bg-popover px-3 py-2 text-xs leading-relaxed text-popover-foreground shadow-lg"
            style={{ left: tipPos.x, top: tipPos.y }}
            role="tooltip"
          >
            {item.description}
          </div>,
          document.body,
        )}
    </>
  );
}
