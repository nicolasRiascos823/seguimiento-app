import { cn } from "@/lib/utils";

export function Table({
  className,
  containerClassName,
  stickyHeader,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & {
  containerClassName?: string;
  stickyHeader?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative w-full overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80",
        stickyHeader && "max-h-[min(70vh,640px)]",
        containerClassName,
      )}
    >
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

export function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        "sticky top-0 z-10 bg-panel/95 backdrop-blur-sm [&_tr]:border-b border-border",
        className,
      )}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border/80 transition-colors duration-150 hover:bg-secondary/40 data-[state=selected]:bg-secondary/60",
        className,
      )}
      {...props}
    />
  );
}

export function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        "h-11 px-4 text-left align-middle text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3.5 align-middle", className)} {...props} />;
}
