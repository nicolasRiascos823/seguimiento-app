import { cn } from "@/lib/utils";

export function Spinner({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-6 w-6 border-2", lg: "h-10 w-10 border-[3px]" };
  return (
    <span
      role="status"
      aria-label="Cargando"
      className={cn(
        "inline-block animate-spin rounded-full border-current border-t-transparent",
        sizes[size],
        className,
      )}
    />
  );
}

export function LoadingBlock({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="space-y-3 py-2" role="status" aria-label={label}>
      <div className="skeleton h-24 w-full rounded-lg" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="skeleton h-40 rounded-lg" />
        <div className="skeleton h-40 rounded-lg" />
      </div>
      <p className="sr-only">{label}</p>
    </div>
  );
}
