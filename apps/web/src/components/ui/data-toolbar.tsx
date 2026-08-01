import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface DataToolbarProps {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  meta?: React.ReactNode;
}

export function DataToolbar({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  filters,
  actions,
  className,
  meta,
}: DataToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg bg-card p-3 shadow-[var(--shadow-card)] ring-1 ring-border/80 sm:flex-row sm:flex-wrap sm:items-center",
        className,
      )}
    >
      {onSearchChange ? (
        <div className="relative min-w-[200px] flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={search ?? ""}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className="pl-9"
            aria-label={searchPlaceholder}
          />
        </div>
      ) : null}
      {filters ? (
        <div className="flex flex-wrap items-center gap-2">{filters}</div>
      ) : null}
      <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:ml-auto">
        {meta}
        {actions}
      </div>
    </div>
  );
}

interface PaginationBarProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  className,
}: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p>
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${from}–${to} de ${total.toLocaleString("es-CO")}`}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted disabled:opacity-40"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Anterior
        </button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <button
          type="button"
          className="rounded-md px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-border transition-colors hover:bg-muted disabled:opacity-40"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
