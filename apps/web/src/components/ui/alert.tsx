import { AlertCircle, CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
  default: {
    container: "border-border bg-muted/30 text-foreground",
    icon: Info,
    iconClass: "text-primary",
  },
  success: {
    container: "border-primary/25 bg-secondary text-secondary-foreground",
    icon: CheckCircle2,
    iconClass: "text-primary",
  },
  warning: {
    container: "border-warning/30 bg-warning-foreground text-warning",
    icon: AlertCircle,
    iconClass: "text-warning",
  },
  destructive: {
    container: "border-destructive/30 bg-destructive-foreground text-destructive",
    icon: XCircle,
    iconClass: "text-destructive",
  },
  info: {
    container: "border-info/30 bg-info-foreground text-info",
    icon: Info,
    iconClass: "text-info",
  },
} as const;

interface AlertProps {
  variant?: keyof typeof variants;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "default", title, children, className }: AlertProps) {
  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div
      role="alert"
      className={cn("flex gap-3 rounded-lg border px-4 py-3 text-sm", config.container, className)}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", config.iconClass)} aria-hidden />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="text-sm opacity-90">{children}</div>
      </div>
    </div>
  );
}
