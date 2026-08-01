import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const toneMap = {
  primary: {
    card: "bg-card",
    icon: "bg-secondary text-primary",
    value: "text-foreground",
  },
  info: {
    card: "bg-card",
    icon: "bg-info-foreground text-info",
    value: "text-foreground",
  },
  warning: {
    card: "bg-card",
    icon: "bg-warning-foreground text-warning",
    value: "text-foreground",
  },
  danger: {
    card: "bg-card",
    icon: "bg-destructive-foreground text-destructive",
    value: "text-foreground",
  },
  stat: {
    card: "bg-card",
    icon: "bg-stat-foreground text-stat",
    value: "text-foreground",
  },
} as const;

export type StatTone = keyof typeof toneMap;

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: StatTone;
  hint?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  className,
}: StatCardProps) {
  const styles = toneMap[tone];

  return (
    <div
      className={cn(
        "rounded-lg p-5 shadow-[var(--shadow-card)] ring-1 ring-border/80",
        styles.card,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </p>
          <p
            className={cn(
              "text-3xl font-semibold tracking-tight tabular-nums",
              styles.value,
            )}
          >
            {typeof value === "number" ? value.toLocaleString("es-CO") : value}
          </p>
          {hint ? (
            <p className="text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
      </div>
    </div>
  );
}
