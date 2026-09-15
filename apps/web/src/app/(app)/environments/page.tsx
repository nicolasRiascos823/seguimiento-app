"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Environment } from "@/lib/types";
import { environmentStatusLabels } from "@/lib/labels";
import { getApiErrorMessage } from "@/lib/utils";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  name: z.string().min(2, "Mínimo 2 caracteres"),
  isVirtual: z.boolean().default(false),
});

type CreateForm = z.infer<typeof createSchema>;

export default function EnvironmentsPage() {
  useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Environment | null>(null);

  const environmentsQuery = useQuery({
    queryKey: ["environments"],
    queryFn: () => apiGet<Environment[]>("/environments"),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
    defaultValues: { isVirtual: false },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => apiPost<Environment>("/environments", data),
    onSuccess: () => {
      toast.success("Ambiente creado");
      reset({ name: "", isVirtual: false });
      queryClient.invalidateQueries({ queryKey: ["environments"] });
      queryClient.invalidateQueries({ queryKey: ["environments-active"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Environment> }) =>
      apiPatch<Environment>(`/environments/${id}`, data),
    onSuccess: () => {
      toast.success("Ambiente actualizado");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["environments"] });
      queryClient.invalidateQueries({ queryKey: ["environments-active"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  return (
    <div>
      <PageHeader
        breadcrumb="Programación"
        title="Ambientes"
        description="Administre los ambientes de formación. Los virtuales permiten varias fichas e instructores a la vez."
      />

      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Nuevo ambiente</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(async (values) => {
                setFormError(null);
                await createMutation.mutateAsync(values);
              })}
              className="space-y-4"
            >
              {formError ? <Alert variant="destructive">{formError}</Alert> : null}
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  placeholder="Ej. Ambiente 301"
                  error={!!errors.name}
                  {...register("name")}
                />
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  {...register("isVirtual", {
                    setValueAs: (value) => value === true || value === "on",
                  })}
                />
                <span>
                  <span className="font-medium">Ambiente virtual</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Permite varias fichas e instructores en el mismo bloque
                    horario.
                  </span>
                </span>
              </label>
              <Button
                type="submit"
                loading={isSubmitting || createMutation.isPending}
                className="w-full"
              >
                Crear ambiente
              </Button>
            </form>
          </CardContent>
        </Card>

        <QueryState
          isLoading={environmentsQuery.isLoading}
          isError={environmentsQuery.isError}
          error={environmentsQuery.error}
          data={environmentsQuery.data}
          isEmpty={(d) => d.length === 0}
          emptyIcon={Building2}
          emptyTitle="No hay ambientes"
          emptyDescription="Cree el primer ambiente de formación."
          loadingLabel="Cargando ambientes..."
        >
          {(items) => (
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>
                          <Badge variant={item.isVirtual ? "stat" : "secondary"}>
                            {item.isVirtual ? "Virtual" : "Presencial"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              item.status === "ACTIVE" ? "success" : "outline"
                            }
                          >
                            {environmentStatusLabels[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditing(item)}
                          >
                            Editar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </QueryState>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar ambiente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Estado</Label>
                <Select
                  id="edit-status"
                  value={editing.status}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      status: e.target.value as Environment["status"],
                    })
                  }
                >
                  {Object.entries(environmentStatusLabels).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </Select>
              </div>
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!editing.isVirtual}
                  onChange={(e) =>
                    setEditing({ ...editing, isVirtual: e.target.checked })
                  }
                />
                <span>
                  <span className="font-medium">Ambiente virtual</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    Permite varias fichas e instructores en el mismo bloque
                    horario.
                  </span>
                </span>
              </label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEditing(null)}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  loading={updateMutation.isPending}
                  onClick={() =>
                    updateMutation.mutate({
                      id: editing.id,
                      data: {
                        name: editing.name,
                        status: editing.status,
                        isVirtual: editing.isVirtual,
                      },
                    })
                  }
                >
                  Guardar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
