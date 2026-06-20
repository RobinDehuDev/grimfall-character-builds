import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-6 flex flex-wrap items-start justify-between gap-4", className)}>
      <div>
        <h1 className="font-display text-2xl tracking-wide text-gold md:text-3xl">{title}</h1>
        {description && (
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function LoadingState({ children }: { children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <p className="py-10 text-center text-sm text-muted-foreground">
      {children ?? t("common.loading")}
    </p>
  );
}

export function EmptyState({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("py-10 text-center text-sm text-muted-foreground", className)}>
      {children}
    </div>
  );
}
