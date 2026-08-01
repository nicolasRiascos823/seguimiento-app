import { cn } from "@/lib/utils";

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

const toneClasses = [
  "bg-secondary text-primary",
  "bg-info-foreground text-info",
  "bg-stat-foreground text-stat",
  "bg-warning-foreground text-warning",
  "bg-muted text-muted-foreground",
] as const;

function toneFromSeed(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash + seed.charCodeAt(i) * (i + 1)) % toneClasses.length;
  }
  return toneClasses[hash] ?? toneClasses[0];
}

interface AvatarProps {
  name: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Avatar({ name, className, size = "md" }: AvatarProps) {
  const sizeClass =
    size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-wide",
        sizeClass,
        toneFromSeed(name),
        className,
      )}
      aria-hidden
    >
      {initialsFromName(name)}
    </span>
  );
}
