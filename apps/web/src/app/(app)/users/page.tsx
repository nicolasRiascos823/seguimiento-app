"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Plus, UserCog } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { PaginatedResult, Role, User } from "@/lib/types";
import { roleLabels, userStatusLabels } from "@/lib/labels";
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
  fullName: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  role: z.enum(["ADMIN", "INSTRUCTOR"]),
});

type CreateForm = z.infer<typeof createSchema>;

export default function UsersPage() {
  useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  const usersQuery = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: () =>
      apiGet<PaginatedResult<User>>("/users", {
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "INSTRUCTOR" },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => apiPost<User>("/users", data),
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      reset({ role: "INSTRUCTOR" });
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiPatch<User>(`/users/${id}/deactivate`),
    onSuccess: () => {
      toast.success("Usuario desactivado");
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        breadcrumb="Sistema"
        title="Usuarios"
        description="Administre cuentas de administradores e instructores."
        actions={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Button>
        }
      />

      <DataToolbar
        className="mb-4"
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por nombre o correo…"
      />

      <QueryState
        isLoading={usersQuery.isLoading}
        isError={usersQuery.isError}
        error={usersQuery.error}
        data={usersQuery.data}
        isEmpty={(d) => d.items.length === 0}
        emptyIcon={UserCog}
        emptyTitle="No hay usuarios"
        emptyDescription="Cree el primer usuario con el botón Nuevo usuario."
        emptyAction={
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            Crear usuario
          </Button>
        }
      >
        {(data) => (
          <div className="overflow-hidden rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
            <Table containerClassName="rounded-none shadow-none ring-0" stickyHeader>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Correo</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.fullName} size="sm" />
                        <span className="font-medium">{u.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "ADMIN" ? "stat" : "secondary"}>
                        {roleLabels[u.role]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={u.status === "ACTIVE" ? "success" : "outline"}
                      >
                        {userStatusLabels[u.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.status === "ACTIVE" ? (
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
                              onSelect={() => deactivateMutation.mutate(u.id)}
                            >
                              Desactivar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Cree una cuenta de administrador o instructor.
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
                <Label htmlFor="fullName">Nombre completo</Label>
                <Input
                  id="fullName"
                  error={!!errors.fullName}
                  {...register("fullName")}
                />
                {errors.fullName ? (
                  <p className="text-xs text-destructive">
                    {errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input
                  id="email"
                  type="email"
                  error={!!errors.email}
                  {...register("email")}
                />
                {errors.email ? (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  error={!!errors.password}
                  {...register("password")}
                />
                {errors.password ? (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select id="role" {...register("role")}>
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </Select>
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
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
