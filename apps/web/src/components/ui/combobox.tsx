"use client";

import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

export type ComboboxOption = {
  value: string;
  label: string;
};

export type ComboboxProps = {
  options: ComboboxOption[];
  value: string;
  onValueChange: (value: string) => void;
  /** Label to show when the selected value is not yet in options. */
  selectedLabel?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  clearLabel?: string;
  allowClear?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  error?: boolean;
  /** Controlled search text (for server-side filtering). */
  search?: string;
  onSearchChange?: (search: string) => void;
  loading?: boolean;
};

export function Combobox({
  options,
  value,
  onValueChange,
  selectedLabel,
  placeholder = "Seleccionar…",
  searchPlaceholder = "Buscar…",
  emptyMessage = "Sin resultados",
  clearLabel,
  allowClear = false,
  disabled = false,
  id,
  className,
  error,
  search: controlledSearch,
  onSearchChange,
  loading = false,
}: ComboboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [internalSearch, setInternalSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const search = controlledSearch ?? internalSearch;
  const setSearch = onSearchChange ?? setInternalSearch;
  const isServerFiltered = onSearchChange != null;

  const selected = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value],
  );

  const filtered = useMemo(() => {
    if (isServerFiltered) return options;
    const q = search.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [isServerFiltered, options, search]);

  const items = useMemo(() => {
    const list: Array<{ value: string; label: string; clear?: boolean }> = [];
    if (allowClear) {
      list.push({ value: "", label: clearLabel ?? "Todas", clear: true });
    }
    list.push(...filtered);
    return list;
  }, [allowClear, clearLabel, filtered]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  function selectValue(next: string) {
    onValueChange(next);
    setOpen(false);
    setSearch("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (!open) {
      if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(items.length - 1, 0)));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const item = items[activeIndex];
      if (item) selectValue(item.value);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        aria-haspopup="listbox"
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-input bg-card px-3 py-2 text-left text-sm text-foreground transition-colors duration-150 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-50",
          error && "border-destructive focus-visible:ring-destructive/25",
          !selected && "text-muted-foreground",
        )}
      >
        <span className="truncate">
          {selected?.label ??
            selectedLabel ??
            (value ? "Cargando…" : placeholder)}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
          {value && allowClear && !disabled ? (
            <span
              role="button"
              tabIndex={-1}
              aria-label="Limpiar selección"
              className="rounded p-0.5 hover:bg-muted hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                selectValue("");
              }}
            >
              <X className="h-3.5 w-3.5" />
            </span>
          ) : null}
          <ChevronsUpDown className="h-4 w-4 opacity-60" />
        </span>
      </button>

      {open ? (
        <div
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-card shadow-[var(--shadow-elevated)]"
          role="presentation"
        >
          <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-autocomplete="list"
              aria-controls={listId}
            />
          </div>
          <ul
            id={listId}
            role="listbox"
            className="max-h-56 overflow-y-auto p-1"
          >
            {loading ? (
              <li className="px-2.5 py-2 text-sm text-muted-foreground">
                Buscando…
              </li>
            ) : items.length === 0 ? (
              <li className="px-2.5 py-2 text-sm text-muted-foreground">
                {emptyMessage}
              </li>
            ) : (
              items.map((item, index) => {
                const isSelected = item.value === value;
                const isActive = index === activeIndex;
                return (
                  <li key={`${item.value || "clear"}-${item.label}`} role="option" aria-selected={isSelected}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left text-sm outline-none",
                        isActive && "bg-muted",
                        isSelected && "font-medium text-primary",
                        !isActive && "hover:bg-muted/70",
                      )}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectValue(item.value)}
                    >
                      <Check
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          isSelected ? "opacity-100" : "opacity-0",
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
