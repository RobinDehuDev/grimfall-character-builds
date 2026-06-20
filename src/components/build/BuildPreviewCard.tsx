import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  FantasyCard,
  CardContent,
} from "@/components/ui/fantasy-card";

interface BuildPreviewCardProps {
  to: string;
  title: string;
  meta: string;
  className?: string;
  buildClass?: string | null;
}

export function BuildPreviewCard({
  to,
  title,
  meta,
  className,
  buildClass,
}: BuildPreviewCardProps) {
  return (
    <Link
      to={to}
      className={cn(
        "block text-inherit no-underline transition-transform hover:-translate-y-0.5",
        className,
      )}
    >
      <FantasyCard className="h-full">
        <CardContent className="p-4">
          {buildClass && (
            <div className="mb-1 font-display text-[10px] tracking-widest text-muted-foreground uppercase">
              {buildClass}
            </div>
          )}
          <div className="mb-2 text-sm font-semibold text-quality-rare">{title}</div>
          <div className="text-xs text-muted-foreground">{meta}</div>
        </CardContent>
      </FantasyCard>
    </Link>
  );
}
