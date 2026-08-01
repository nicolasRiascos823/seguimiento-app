"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Eye, GraduationCap, MoreHorizontal, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import type { Apprentice, Group, PaginatedResult } from "@/lib/types";
import { apprenticeStatusLabels } from "@/lib/labels";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { QueryState } from "@/components/query-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataToolbar, PaginationBar } from "@/components/ui/data-toolbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ApprenticesPage() {
  useRequireAuth();
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [document, setDocument] = useState("");
  const [groupId, setGroupId] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebouncedValue(search);
  const debouncedDocument = useDebouncedValue(document);

  const groupsQuery = useQuery({
    queryKey: ["groups-options"],
    queryFn: () => apiGet<PaginatedResult<Group>>("/groups", { limit: 100 }),
  });

  const params = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      document: debouncedDocument || undefined,
      groupId: groupId || undefined,
      status: status || undefined,
      page,
      limit: 20,
    }),
    [debouncedSearch, debouncedDocument, groupId, status, page],
  );

  const apprenticesQuery = useQuery({
    queryKey: ["apprentices", params],
    queryFn: () => apiGet<PaginatedResult<Apprentice>>("/apprentices", params),
  });

  return (
    <div>
      <PageHeader
        breadcrumb="Formación"
        title="Aprendices"
        description="Busque y consulte el detalle de los aprendices en formación."
        actions={
          user?.role === "ADMIN" ? (
            <Link href="/apprentices/import">
              <Button variant="outline" size="sm">
                <Upload className="h-4 w-4" />
                Importar
              </Button>
            </Link>
          ) : undefined
        }
      />

      <DataToolbar
        className="mb-4"
        search={search}
        onSearchChange={(v) => {
          setSearch(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nombre…"
        filters={
          <>
            <Input
              value={document}
              onChange={(e) => {
                setDocument(e.target.value);
                setPage(1);
              }}
              placeholder="N.º documento"
              aria-label="Número de documento"
              className="w-[150px]"
            />
            <Select
              value={groupId}
              onChange={(e) => {
                setGroupId(e.target.value);
                setPage(1);
              }}
              aria-label="Ficha"
              className="w-[140px]"
            >
              <option value="">Todas las fichas</option>
              {groupsQuery.data?.items.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.number}
                </option>
              ))}
            </Select>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              aria-label="Estado"
              className="w-[140px]"
            >
              <option value="">Todos los estados</option>
              {Object.entries(apprenticeStatusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </>
        }
      />

      <QueryState
        isLoading={apprenticesQuery.isLoading}
        isError={apprenticesQuery.isError}
        error={apprenticesQuery.error}
        data={apprenticesQuery.data}
        isEmpty={(d) => d.items.length === 0}
        emptyIcon={GraduationCap}
        emptyTitle="No se encontraron aprendices"
        emptyDescription="Ajuste los filtros o importe aprendices desde el módulo de importación."
      >
        {(data) => (
          <div className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
            <Table containerClassName="rounded-none shadow-none ring-0" stickyHeader>
              <TableHeader>
                <TableRow>
                  <TableHead>Aprendiz</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((apprentice) => {
                  const fullName = `${apprentice.firstName} ${apprentice.lastName}`;
                  return (
                    <TableRow key={apprentice.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={fullName} size="sm" />
                          <Link
                            href={`/apprentices/${apprentice.id}`}
                            className="font-medium text-foreground hover:text-primary"
                          >
                            {fullName}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell className="tabular-nums text-muted-foreground">
                        {apprentice.document}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {apprentice.group?.number ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            apprentice.status === "ACTIVE" ? "success" : "outline"
                          }
                        >
                          {apprenticeStatusLabels[apprentice.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/apprentices/${apprentice.id}`}>
                                <Eye className="h-4 w-4" />
                                Ver detalle
                              </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <PaginationBar
              page={page}
              pageSize={20}
              total={data.meta?.total ?? data.items.length}
              onPageChange={setPage}
            />
          </div>
        )}
      </QueryState>
    </div>
  );
}
