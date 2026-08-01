"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, MoreHorizontal, Plus } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  Apprentice,
  CommitteeStatus,
  PaginatedResult,
  Warning,
  WarningCallNumber,
} from "@/lib/types";
import { callNumberLabels, committeeStatusLabels } from "@/lib/labels";
import { formatDate, getApiErrorMessage } from "@/lib/utils";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataToolbar } from "@/components/ui/data-toolbar";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const schema = z.object({
  date: z.string().min(1),
  apprenticeId: z.string().uuid("Seleccione un aprendiz"),
  callNumber: z.enum(["FIRST", "SECOND"]),
  reason: z.string().min(3),
  observation: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function WarningsPage() {
  useRequireAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [callFilter, setCallFilter] = useState("");
  const [committeeFilter, setCommitteeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const apprenticesQuery = useQuery({
    queryKey: ["apprentices-options"],
    queryFn: () => apiGet<PaginatedResult<Apprentice>>("/apprentices", { limit: 100 }),
  });

  const listParams = useMemo(
    () => ({
      callNumber: callFilter || undefined,
      committeeStatus: committeeFilter || undefined,
      limit: 50,
    }),
    [callFilter, committeeFilter],
  );

  const warningsQuery = useQuery({
    queryKey: ["warnings", listParams],
    queryFn: () => apiGet<PaginatedResult<Warning>>("/warnings", listParams),
  });

  const hasSecondCall =
    warningsQuery.data?.items.some((w) => w.callNumber === "SECOND") ?? false;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      callNumber: "FIRST",
      date: new Date().toISOString().slice(0, 10),
    },
  });

  const callNumber = watch("callNumber");

  const createMutation = useMutation({
    mutationFn: (data: FormValues) => apiPost<Warning>("/warnings", data),
    onSuccess: () => {
      toast.success("Llamado de atención registrado");
      reset({
        callNumber: "FIRST",
        date: new Date().toISOString().slice(0, 10),
      });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const committeeMutation = useMutation({
    mutationFn: ({
      id,
      committeeStatus,
    }: {
      id: string;
      committeeStatus: CommitteeStatus;
    }) =>
      apiPatch<Warning>(`/warnings/${id}/committee-status`, { committeeStatus }),
    onSuccess: () => {
      toast.success("Estado de comité actualizado");
      queryClient.invalidateQueries({ queryKey: ["warnings"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        breadcrumb="Seguimiento"
        title="Llamados de atención"
        description="Registre llamados y gestione el estado del comité disciplinario."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo llamado
          </Button>
        }
      />

      {(hasSecondCall || callNumber === "SECOND") && (
        <Alert
          variant="destructive"
          className="mb-6"
          title="Alerta: segundo llamado"
        >
          Los segundos llamados requieren seguimiento en comité disciplinario.
        </Alert>
      )}

      <DataToolbar
        className="mb-4"
        filters={
          <>
            <Select
              value={callFilter}
              onChange={(e) => setCallFilter(e.target.value)}
              aria-label="Filtrar por llamado"
              className="w-[160px]"
            >
              <option value="">Todos los llamados</option>
              {(Object.keys(callNumberLabels) as WarningCallNumber[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {callNumberLabels[value]}
                  </option>
                ),
              )}
            </Select>
            <Select
              value={committeeFilter}
              onChange={(e) => setCommitteeFilter(e.target.value)}
              aria-label="Filtrar por comité"
              className="w-[180px]"
            >
              <option value="">Todos los comités</option>
              {(Object.keys(committeeStatusLabels) as CommitteeStatus[]).map(
                (value) => (
                  <option key={value} value={value}>
                    {committeeStatusLabels[value]}
                  </option>
                ),
              )}
            </Select>
          </>
        }
      />

      <QueryState
        isLoading={warningsQuery.isLoading}
        isError={warningsQuery.isError}
        error={warningsQuery.error}
        data={warningsQuery.data}
        isEmpty={(d) => d.items.length === 0}
        emptyIcon={AlertTriangle}
        emptyTitle="No hay llamados registrados"
        emptyDescription="Los llamados de atención aparecerán aquí."
        emptyAction={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Registrar llamado
          </Button>
        }
      >
        {(data) => (
          <div className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
            <Table containerClassName="rounded-none shadow-none ring-0" stickyHeader>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Aprendiz</TableHead>
                  <TableHead>Llamado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Comité</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => {
                  const name = item.apprentice
                    ? `${item.apprentice.firstName} ${item.apprentice.lastName}`
                    : "—";
                  return (
                    <TableRow
                      key={item.id}
                      className={
                        item.callNumber === "SECOND"
                          ? "bg-destructive-foreground/40"
                          : undefined
                      }
                    >
                      <TableCell className="tabular-nums text-muted-foreground">
                        {formatDate(item.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar name={name} size="sm" />
                          {item.apprentice ? (
                            <Link
                              href={`/apprentices/${item.apprentice.id}`}
                              className="font-medium hover:text-primary"
                            >
                              {name}
                            </Link>
                          ) : (
                            name
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.callNumber ? (
                          <Badge
                            variant={
                              item.callNumber === "SECOND"
                                ? "destructive"
                                : "warning"
                            }
                          >
                            {callNumberLabels[item.callNumber]}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">
                        {item.reason}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            item.committeeStatus === "PENDING" ||
                            item.committeeStatus === "IN_COMMITTEE"
                              ? "warning"
                              : "outline"
                          }
                        >
                          {committeeStatusLabels[item.committeeStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Estado comité</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {(
                              Object.keys(
                                committeeStatusLabels,
                              ) as CommitteeStatus[]
                            ).map((value) => (
                              <DropdownMenuItem
                                key={value}
                                onSelect={() =>
                                  committeeMutation.mutate({
                                    id: item.id,
                                    committeeStatus: value,
                                  })
                                }
                              >
                                {committeeStatusLabels[value]}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo llamado de atención</DialogTitle>
            <DialogDescription>
              Complete los datos. El segundo llamado marca comité pendiente.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(async (values) => {
              setFormError(null);
              await createMutation.mutateAsync(values);
            })}
          >
            <DialogBody className="space-y-4">
              {formError ? (
                <Alert variant="destructive">{formError}</Alert>
              ) : null}
              {callNumber === "SECOND" ? (
                <Alert variant="warning" title="Segundo llamado">
                  Se generará seguimiento de comité disciplinario.
                </Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  error={!!errors.date}
                  {...register("date")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apprenticeId">Aprendiz</Label>
                <Select
                  id="apprenticeId"
                  defaultValue=""
                  error={!!errors.apprenticeId}
                  {...register("apprenticeId")}
                >
                  <option value="" disabled>
                    Seleccionar aprendiz
                  </option>
                  {apprenticesQuery.data?.items.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.firstName} {a.lastName} — {a.document}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callNumber">Número de llamado</Label>
                <Select id="callNumber" {...register("callNumber")}>
                  {(Object.keys(callNumberLabels) as WarningCallNumber[]).map(
                    (value) => (
                      <option key={value} value={value}>
                        {callNumberLabels[value]}
                      </option>
                    ),
                  )}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reason">Motivo</Label>
                <Input
                  id="reason"
                  error={!!errors.reason}
                  {...register("reason")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observation">Observación (opcional)</Label>
                <Textarea id="observation" {...register("observation")} />
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={isSubmitting || createMutation.isPending}
              >
                Registrar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
