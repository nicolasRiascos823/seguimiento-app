"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Plus, UsersRound } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Group, PaginatedResult, User } from "@/lib/types";
import { groupStatusLabels } from "@/lib/labels";
import { getApiErrorMessage } from "@/lib/utils";
import { useDebouncedValue } from "@/lib/use-debounced-value";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const createSchema = z.object({
  number: z.string().min(3, "Mínimo 3 caracteres"),
  leaderId: z.string().uuid("Seleccione un instructor"),
});

type CreateForm = z.infer<typeof createSchema>;

export default function GroupsPage() {
  const { user } = useAuth();
  useRequireAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const isAdmin = user?.role === "ADMIN";

  const groupsQuery = useQuery({
    queryKey: ["groups", debouncedSearch],
    queryFn: () =>
      apiGet<PaginatedResult<Group>>("/groups", {
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const instructorsQuery = useQuery({
    queryKey: ["instructors"],
    queryFn: () => apiGet<User[]>("/users/instructors"),
    enabled: isAdmin,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => apiPost<Group>("/groups", data),
    onSuccess: () => {
      toast.success("Ficha creada correctamente");
      reset();
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) =>
      apiPatch<Group>(`/groups/${id}`, { status: "INACTIVE" }),
    onSuccess: () => {
      toast.success("Ficha desactivada");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        breadcrumb="Formación"
        title="Fichas"
        description="Consulte y administre las fichas de formación y su instructor líder."
        actions={
          isAdmin ? (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva ficha
            </Button>
          ) : undefined
        }
      />

      <DataToolbar
        className="mb-4"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por número de ficha…"
      />

      <QueryState
        isLoading={groupsQuery.isLoading}
        isError={groupsQuery.isError}
        error={groupsQuery.error}
        data={groupsQuery.data}
        isEmpty={(d) => d.items.length === 0}
        emptyIcon={UsersRound}
        emptyTitle="No hay fichas registradas"
        emptyDescription="Las fichas aparecerán aquí cuando se creen."
        emptyAction={
          isAdmin ? (
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              Crear ficha
            </Button>
          ) : undefined
        }
      >
        {(data) => (
          <div className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
            <Table containerClassName="rounded-none shadow-none ring-0" stickyHeader>
              <TableHeader>
                <TableRow>
                  <TableHead>Ficha</TableHead>
                  <TableHead>Instructor líder</TableHead>
                  <TableHead>Aprendices</TableHead>
                  <TableHead>Estado</TableHead>
                  {isAdmin ? (
                    <TableHead className="w-12">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-primary">
                          {group.number.slice(-2)}
                        </span>
                        <span className="font-medium tabular-nums">
                          {group.number}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {group.leader ? (
                        <div className="flex items-center gap-2">
                          <Avatar name={group.leader.fullName} size="sm" />
                          <span>{group.leader.fullName}</span>
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {group._count?.apprentices ?? 0}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          group.status === "ACTIVE" ? "success" : "outline"
                        }
                      >
                        {groupStatusLabels[group.status]}
                      </Badge>
                    </TableCell>
                    {isAdmin ? (
                      <TableCell>
                        {group.status === "ACTIVE" ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                destructive
                                onSelect={() =>
                                  deactivateMutation.mutate(group.id)
                                }
                              >
                                Desactivar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : null}
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      {isAdmin ? (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nueva ficha</DialogTitle>
              <DialogDescription>
                Asigne número e instructor líder.
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
                <div className="space-y-2">
                  <Label htmlFor="number">Número de ficha</Label>
                  <Input
                    id="number"
                    placeholder="Ej. 2557890"
                    error={!!errors.number}
                    {...register("number")}
                  />
                  {errors.number ? (
                    <p className="text-xs text-destructive">
                      {errors.number.message}
                    </p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="leaderId">Instructor líder</Label>
                  <Select
                    id="leaderId"
                    error={!!errors.leaderId}
                    {...register("leaderId")}
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleccionar instructor
                    </option>
                    {instructorsQuery.data?.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.fullName}
                      </option>
                    ))}
                  </Select>
                  {errors.leaderId ? (
                    <p className="text-xs text-destructive">
                      {errors.leaderId.message}
                    </p>
                  ) : null}
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
                  Crear ficha
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      ) : null}
    </div>
  );
}
