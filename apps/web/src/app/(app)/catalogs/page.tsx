"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPatch, apiPost } from "@/lib/api";
import type { Competency, LearningOutcome } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const competencySchema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  description: z.string().optional(),
});

const outcomeSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(3),
  description: z.string().optional(),
  competencyId: z.string().uuid("Seleccione una competencia"),
});

type CompetencyForm = z.infer<typeof competencySchema>;
type OutcomeForm = z.infer<typeof outcomeSchema>;

export default function CatalogsPage() {
  useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const [compError, setCompError] = useState<string | null>(null);
  const [outError, setOutError] = useState<string | null>(null);

  const competenciesQuery = useQuery({
    queryKey: ["competencies"],
    queryFn: () => apiGet<Competency[]>("/catalogs/competencies"),
  });

  const competencyForm = useForm<CompetencyForm>({ resolver: zodResolver(competencySchema) });
  const outcomeForm = useForm<OutcomeForm>({ resolver: zodResolver(outcomeSchema) });

  const createCompetency = useMutation({
    mutationFn: (data: CompetencyForm) => apiPost<Competency>("/catalogs/competencies", data),
    onSuccess: () => {
      toast.success("Competencia creada");
      competencyForm.reset();
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
    },
    onError: (err) => setCompError(getApiErrorMessage(err)),
  });

  const createOutcome = useMutation({
    mutationFn: (data: OutcomeForm) => apiPost<LearningOutcome>("/catalogs/learning-outcomes", data),
    onSuccess: () => {
      toast.success("Resultado de aprendizaje creado");
      outcomeForm.reset();
      queryClient.invalidateQueries({ queryKey: ["competencies"] });
    },
    onError: (err) => setOutError(getApiErrorMessage(err)),
  });

  const toggleCompetency = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiPatch<Competency>(`/catalogs/competencies/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["competencies"] }),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const toggleOutcome = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      apiPatch<LearningOutcome>(`/catalogs/learning-outcomes/${id}`, { active }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["competencies"] }),
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const allOutcomes =
    competenciesQuery.data?.flatMap((c) =>
      (c.learningOutcomes ?? []).map((o) => ({ ...o, competency: c })),
    ) ?? [];

  return (
    <div>
      <PageHeader
        breadcrumb="Sistema"
        title="Catálogos"
        description="Administre competencias y resultados de aprendizaje (RA)."
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nueva competencia</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={competencyForm.handleSubmit(async (values) => {
                  setCompError(null);
                  await createCompetency.mutateAsync(values);
                })}
                className="space-y-4"
              >
                {compError ? <Alert variant="destructive">{compError}</Alert> : null}
                <div className="space-y-2">
                  <Label htmlFor="comp-code">Código</Label>
                  <Input id="comp-code" {...competencyForm.register("code")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-name">Nombre</Label>
                  <Input id="comp-name" {...competencyForm.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="comp-desc">Descripción</Label>
                  <Textarea id="comp-desc" {...competencyForm.register("description")} />
                </div>
                <Button type="submit" loading={createCompetency.isPending} className="w-full">
                  Crear competencia
                </Button>
              </form>
            </CardContent>
          </Card>

          <QueryState
            isLoading={competenciesQuery.isLoading}
            isError={competenciesQuery.isError}
            error={competenciesQuery.error}
            data={competenciesQuery.data}
            isEmpty={(d) => d.length === 0}
            emptyIcon={BookOpen}
            emptyTitle="Sin competencias"
            loadingLabel="Cargando competencias..."
          >
            {(competencies) => (
              <Card>
                <CardHeader>
                  <CardTitle>Competencias</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {competencies.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell>{comp.code}</TableCell>
                          <TableCell>{comp.name}</TableCell>
                          <TableCell>
                            <Badge variant={comp.active ? "success" : "outline"}>
                              {comp.active ? "Activa" : "Inactiva"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                toggleCompetency.mutate({ id: comp.id, active: !comp.active })
                              }
                            >
                              {comp.active ? "Desactivar" : "Activar"}
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

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nuevo resultado de aprendizaje</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={outcomeForm.handleSubmit(async (values) => {
                  setOutError(null);
                  await createOutcome.mutateAsync(values);
                })}
                className="space-y-4"
              >
                {outError ? <Alert variant="destructive">{outError}</Alert> : null}
                <div className="space-y-2">
                  <Label htmlFor="out-comp">Competencia</Label>
                  <Select id="out-comp" defaultValue="" {...outcomeForm.register("competencyId")}>
                    <option value="" disabled>
                      Seleccionar
                    </option>
                    {competenciesQuery.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} — {c.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="out-code">Código RA</Label>
                  <Input id="out-code" {...outcomeForm.register("code")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="out-name">Nombre</Label>
                  <Input id="out-name" {...outcomeForm.register("name")} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="out-desc">Descripción</Label>
                  <Textarea id="out-desc" {...outcomeForm.register("description")} />
                </div>
                <Button type="submit" loading={createOutcome.isPending} className="w-full">
                  Crear RA
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resultados de aprendizaje</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {allOutcomes.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground">No hay resultados de aprendizaje.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Competencia</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allOutcomes.map((outcome) => (
                      <TableRow key={outcome.id}>
                        <TableCell>{outcome.code}</TableCell>
                        <TableCell>{outcome.name}</TableCell>
                        <TableCell>{outcome.competency?.code}</TableCell>
                        <TableCell>
                          <Badge variant={outcome.active ? "success" : "outline"}>
                            {outcome.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              toggleOutcome.mutate({ id: outcome.id, active: !outcome.active })
                            }
                          >
                            {outcome.active ? "Desactivar" : "Activar"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
