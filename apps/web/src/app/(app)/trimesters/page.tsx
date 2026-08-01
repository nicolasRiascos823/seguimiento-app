"use client";



import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { zodResolver } from "@hookform/resolvers/zod";

import { CalendarRange } from "lucide-react";

import { useState } from "react";

import { useForm } from "react-hook-form";

import { toast } from "sonner";

import { z } from "zod";

import { useAuth, useRequireAuth } from "@/lib/auth";

import { apiGet, apiPatch, apiPost } from "@/lib/api";

import type { Trimester } from "@/lib/types";

import { trimesterStatusLabels } from "@/lib/labels";

import { formatDate, getApiErrorMessage } from "@/lib/utils";

import { QueryState } from "@/components/query-state";

import { Alert } from "@/components/ui/alert";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { PageHeader } from "@/components/ui/page-header";

import { Select } from "@/components/ui/select";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";



const createSchema = z.object({

  name: z.string().min(2, "Mínimo 2 caracteres"),

  startDate: z.string().min(1, "Fecha requerida"),

  endDate: z.string().min(1, "Fecha requerida"),

});



type CreateForm = z.infer<typeof createSchema>;



export default function TrimestersPage() {

  const { user } = useAuth();

  useRequireAuth(["ADMIN"]);

  const queryClient = useQueryClient();

  const [formError, setFormError] = useState<string | null>(null);

  const [editing, setEditing] = useState<Trimester | null>(null);



  const trimestersQuery = useQuery({

    queryKey: ["trimesters"],

    queryFn: () => apiGet<Trimester[]>("/trimesters"),

  });



  const {

    register,

    handleSubmit,

    reset,

    formState: { errors, isSubmitting },

  } = useForm<CreateForm>({ resolver: zodResolver(createSchema) });



  const createMutation = useMutation({

    mutationFn: (data: CreateForm) => apiPost<Trimester>("/trimesters", data),

    onSuccess: () => {

      toast.success("Trimestre creado");

      reset();

      queryClient.invalidateQueries({ queryKey: ["trimesters"] });

    },

    onError: (err) => setFormError(getApiErrorMessage(err)),

  });



  const updateMutation = useMutation({

    mutationFn: ({ id, data }: { id: string; data: Partial<Trimester> }) =>

      apiPatch<Trimester>(`/trimesters/${id}`, data),

    onSuccess: () => {

      toast.success("Trimestre actualizado");

      setEditing(null);

      queryClient.invalidateQueries({ queryKey: ["trimesters"] });

    },

    onError: (err) => toast.error(getApiErrorMessage(err)),

  });



  return (

    <div>

      <PageHeader

        breadcrumb="Programación"

        title="Trimestres"

        description="Administre los periodos académicos del seguimiento formativo."

      />



      <div className="grid gap-8 lg:grid-cols-[360px_1fr]">

        <Card>

          <CardHeader>

            <CardTitle>Nuevo trimestre</CardTitle>

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

                <Input id="name" placeholder="Ej. Trimestre I 2026" error={!!errors.name} {...register("name")} />

              </div>

              <div className="space-y-2">

                <Label htmlFor="startDate">Fecha inicio</Label>

                <Input id="startDate" type="date" error={!!errors.startDate} {...register("startDate")} />

              </div>

              <div className="space-y-2">

                <Label htmlFor="endDate">Fecha fin</Label>

                <Input id="endDate" type="date" error={!!errors.endDate} {...register("endDate")} />

              </div>

              <Button type="submit" loading={isSubmitting || createMutation.isPending} className="w-full">

                Crear trimestre

              </Button>

            </form>

          </CardContent>

        </Card>



        <QueryState

          isLoading={trimestersQuery.isLoading}

          isError={trimestersQuery.isError}

          error={trimestersQuery.error}

          data={trimestersQuery.data}

          isEmpty={(d) => d.length === 0}

          emptyIcon={CalendarRange}

          emptyTitle="No hay trimestres"

          emptyDescription="Cree el primer trimestre académico."

          loadingLabel="Cargando trimestres..."

        >

          {(items) => (

            <Card>

              <CardContent className="p-0">

                <Table>

                  <TableHeader>

                    <TableRow>

                      <TableHead>Nombre</TableHead>

                      <TableHead>Inicio</TableHead>

                      <TableHead>Fin</TableHead>

                      <TableHead>Estado</TableHead>

                      {user?.role === "ADMIN" ? <TableHead className="text-right">Acciones</TableHead> : null}

                    </TableRow>

                  </TableHeader>

                  <TableBody>

                    {items.map((item) => (

                      <TableRow key={item.id}>

                        <TableCell className="font-medium">{item.name}</TableCell>

                        <TableCell>{formatDate(item.startDate)}</TableCell>

                        <TableCell>{formatDate(item.endDate)}</TableCell>

                        <TableCell>

                          <Badge variant={item.status === "ACTIVE" ? "success" : "outline"}>

                            {trimesterStatusLabels[item.status]}

                          </Badge>

                        </TableCell>

                        <TableCell className="text-right">

                          <Button variant="outline" size="sm" onClick={() => setEditing(item)}>

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

              <CardTitle>Editar trimestre</CardTitle>

            </CardHeader>

            <CardContent className="space-y-4">

              <div className="space-y-2">

                <Label htmlFor="edit-name">Nombre</Label>

                <Input

                  id="edit-name"

                  defaultValue={editing.name}

                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="edit-start">Fecha inicio</Label>

                <Input

                  id="edit-start"

                  type="date"

                  defaultValue={editing.startDate.slice(0, 10)}

                  onChange={(e) => setEditing({ ...editing, startDate: e.target.value })}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="edit-end">Fecha fin</Label>

                <Input

                  id="edit-end"

                  type="date"

                  defaultValue={editing.endDate.slice(0, 10)}

                  onChange={(e) => setEditing({ ...editing, endDate: e.target.value })}

                />

              </div>

              <div className="space-y-2">

                <Label htmlFor="edit-status">Estado</Label>

                <Select

                  id="edit-status"

                  value={editing.status}

                  onChange={(e) =>

                    setEditing({ ...editing, status: e.target.value as Trimester["status"] })

                  }

                >

                  {Object.entries(trimesterStatusLabels).map(([value, label]) => (

                    <option key={value} value={value}>

                      {label}

                    </option>

                  ))}

                </Select>

              </div>

              <div className="flex gap-2">

                <Button variant="outline" className="flex-1" onClick={() => setEditing(null)}>

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

                        startDate: editing.startDate.slice(0, 10),

                        endDate: editing.endDate.slice(0, 10),

                        status: editing.status,

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

