import { useCallback, useRef, useState } from "react";

const TIP_WIDTH = 280;

export type TalentTooltipPlacement = "above" | "below";

export function useTalentHoverTooltip(placement: TalentTooltipPlacement = "below") {
  const [showTip, setShowTip] = useState(false);
  const [tipPos, setTipPos] = useState({ x: 0, y: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const updateTipPosition = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    let x = rect.left + rect.width / 2 - TIP_WIDTH / 2;
    x = Math.max(8, Math.min(x, window.innerWidth - TIP_WIDTH - 8));
    const y = placement === "below" ? rect.bottom + 8 : rect.top - 8;
    setTipPos({ x, y });
  }, [placement]);

  const showTooltip = useCallback(() => {
    updateTipPosition();
    setShowTip(true);
  }, [updateTipPosition]);

  const hideTooltip = useCallback(() => {
    setShowTip(false);
  }, []);

  return {
    btnRef,
    showTip,
    tipPos,
    tipWidth: TIP_WIDTH,
    showTooltip,
    hideTooltip,
    placement,
  };
}
