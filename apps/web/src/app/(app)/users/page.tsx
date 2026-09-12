"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { MoreHorizontal, Plus, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { PaginatedResult, Role, User, UserStatus } from "@/lib/types";
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

const editSchema = z.object({
  fullName: z.string().min(3, "Mínimo 3 caracteres"),
  email: z.string().email("Correo inválido"),
  password: z.union([
    z.literal(""),
    z.string().min(8, "Mínimo 8 caracteres"),
  ]),
  role: z.enum(["ADMIN", "INSTRUCTOR"]),
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

export default function UsersPage() {
  useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const debouncedSearch = useDebouncedValue(search);

  const usersQuery = useQuery({
    queryKey: ["users", debouncedSearch],
    queryFn: () =>
      apiGet<PaginatedResult<User>>("/users", {
        search: debouncedSearch || undefined,
        limit: 50,
      }),
  });

  const createForm = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { role: "INSTRUCTOR" },
  });

  const editForm = useForm<EditForm>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      role: "INSTRUCTOR",
      status: "ACTIVE",
    },
  });

  useEffect(() => {
    if (!editingUser) return;
    editForm.reset({
      fullName: editingUser.fullName,
      email: editingUser.email,
      password: "",
      role: editingUser.role,
      status: editingUser.status,
    });
    setEditError(null);
  }, [editingUser, editForm]);

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => apiPost<User>("/users", data),
    onSuccess: () => {
      toast.success("Usuario creado correctamente");
      createForm.reset({ role: "INSTRUCTOR" });
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setCreateError(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditForm }) => {
      const payload: {
        fullName: string;
        email: string;
        role: Role;
        status: UserStatus;
        password?: string;
      } = {
        fullName: data.fullName,
        email: data.email,
        role: data.role,
        status: data.status,
      };
      if (data.password) {
        payload.password = data.password;
      }
      return apiPatch<User>(`/users/${id}`, payload);
    },
    onSuccess: () => {
      toast.success("Usuario actualizado");
      setEditingUser(null);
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
    onError: (err) => setEditError(getApiErrorMessage(err)),
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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
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
          <Button size="sm" onClick={() => setCreateOpen(true)}>
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
                          <DropdownMenuItem onSelect={() => setEditingUser(u)}>
                            Editar
                          </DropdownMenuItem>
                          {u.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              destructive
                              onSelect={() => deactivateMutation.mutate(u.id)}
                            >
                              Desactivar
                            </DropdownMenuItem>
                          ) : null}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </QueryState>

      <Dialog
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCreateError(null);
            createForm.reset({ role: "INSTRUCTOR" });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Cree una cuenta de administrador o instructor.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={createForm.handleSubmit(async (values) => {
              setCreateError(null);
              await createMutation.mutateAsync(values);
            })}
          >
            <DialogBody className="space-y-4">
              {createError ? (
                <Alert variant="destructive">{createError}</Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="create-fullName">Nombre completo</Label>
                <Input
                  id="create-fullName"
                  error={!!createForm.formState.errors.fullName}
                  {...createForm.register("fullName")}
                />
                {createForm.formState.errors.fullName ? (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-email">Correo</Label>
                <Input
                  id="create-email"
                  type="email"
                  error={!!createForm.formState.errors.email}
                  {...createForm.register("email")}
                />
                {createForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-password">Contraseña</Label>
                <Input
                  id="create-password"
                  type="password"
                  error={!!createForm.formState.errors.password}
                  {...createForm.register("password")}
                />
                {createForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">
                    {createForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="create-role">Rol</Label>
                <Select id="create-role" {...createForm.register("role")}>
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
                onClick={() => setCreateOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={
                  createForm.formState.isSubmitting || createMutation.isPending
                }
              >
                Crear usuario
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              Actualice los datos de la cuenta. Deje la contraseña vacía si no
              desea cambiarla.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={editForm.handleSubmit(async (values) => {
              if (!editingUser) return;
              setEditError(null);
              await updateMutation.mutateAsync({
                id: editingUser.id,
                data: values,
              });
            })}
          >
            <DialogBody className="space-y-4">
              {editError ? (
                <Alert variant="destructive">{editError}</Alert>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="edit-fullName">Nombre completo</Label>
                <Input
                  id="edit-fullName"
                  error={!!editForm.formState.errors.fullName}
                  {...editForm.register("fullName")}
                />
                {editForm.formState.errors.fullName ? (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.fullName.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Correo</Label>
                <Input
                  id="edit-email"
                  type="email"
                  error={!!editForm.formState.errors.email}
                  {...editForm.register("email")}
                />
                {editForm.formState.errors.email ? (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-password">
                  Nueva contraseña{" "}
                  <span className="font-normal text-muted-foreground">
                    (opcional)
                  </span>
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  placeholder="Dejar vacío para no cambiar"
                  error={!!editForm.formState.errors.password}
                  {...editForm.register("password")}
                />
                {editForm.formState.errors.password ? (
                  <p className="text-xs text-destructive">
                    {editForm.formState.errors.password.message}
                  </p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rol</Label>
                <Select id="edit-role" {...editForm.register("role")}>
                  {(Object.keys(roleLabels) as Role[]).map((role) => (
                    <option key={role} value={role}>
                      {roleLabels[role]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select id="edit-status" {...editForm.register("status")}>
                  {(Object.keys(userStatusLabels) as UserStatus[]).map(
                    (status) => (
                      <option key={status} value={status}>
                        {userStatusLabels[status]}
                      </option>
                    ),
                  )}
                </Select>
              </div>
            </DialogBody>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingUser(null)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={
                  editForm.formState.isSubmitting || updateMutation.isPending
                }
              >
                Guardar cambios
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
