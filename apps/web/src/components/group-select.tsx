"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Combobox } from "@/components/ui/combobox";
import { apiGet } from "@/lib/api";
import type { Group, PaginatedResult } from "@/lib/types";
import { useDebouncedValue } from "@/lib/use-debounced-value";

export type GroupSelectProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  clearLabel?: string;
  allowClear?: boolean;
  status?: "ACTIVE" | "INACTIVE";
  disabled?: boolean;
  id?: string;
  className?: string;
  error?: boolean;
};

export function GroupSelect({
  value,
  onValueChange,
  placeholder = "Seleccionar ficha",
  clearLabel = "Todas las fichas",
  allowClear = false,
  status,
  disabled,
  id,
  className,
  error,
}: GroupSelectProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);

  const groupsQuery = useQuery({
    queryKey: ["groups-select", debouncedSearch, status ?? "all"],
    queryFn: () =>
      apiGet<PaginatedResult<Group>>("/groups", {
        search: debouncedSearch || undefined,
        status,
        limit: 50,
      }),
  });

  const selectedQuery = useQuery({
    queryKey: ["group", value],
    queryFn: () => apiGet<Group>(`/groups/${value}`),
    enabled: !!value,
    staleTime: 60_000,
  });

  const options = useMemo(() => {
    const map = new Map<string, { value: string; label: string }>();
    for (const group of groupsQuery.data?.items ?? []) {
      map.set(group.id, { value: group.id, label: group.number });
    }
    if (selectedQuery.data) {
      map.set(selectedQuery.data.id, {
        value: selectedQuery.data.id,
        label: selectedQuery.data.number,
      });
    }
    return [...map.values()].sort((a, b) =>
      a.label.localeCompare(b.label, "es", { numeric: true }),
    );
  }, [groupsQuery.data?.items, selectedQuery.data]);

  return (
    <Combobox
      id={id}
      className={className}
      error={error}
      disabled={disabled}
      options={options}
      value={value}
      onValueChange={onValueChange}
      selectedLabel={selectedQuery.data?.number}
      placeholder={placeholder}
      searchPlaceholder="Escribir número de ficha…"
      emptyMessage="No se encontraron fichas"
      clearLabel={clearLabel}
      allowClear={allowClear}
      search={search}
      onSearchChange={setSearch}
      loading={groupsQuery.isFetching}
    />
  );
}
