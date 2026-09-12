"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiPost } from "@/lib/api";
import type {
  Evaluation,
  EvaluationMatrixResponse,
  PerformanceStatus,
  Trimester,
} from "@/lib/types";
import { performanceStatusVariant } from "@/lib/labels";
import { cn, getApiErrorMessage } from "@/lib/utils";
import { GroupSelect } from "@/components/group-select";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface CellEditorState {
  apprenticeId: string;
  apprenticeName: string;
  instructorId: string;
  instructorName: string;
  performanceStatusId: string;
  observations: string;
  commitments: string;
}

const cellTone: Record<string, string> = {
  EXCELENTE: "bg-secondary/80 hover:bg-secondary",
  BUENO: "bg-info-foreground/70 hover:bg-info-foreground",
  ACEPTABLE: "bg-stat-foreground/60 hover:bg-stat-foreground",
  REGULAR: "bg-warning-foreground/70 hover:bg-warning-foreground",
  DEFICIENTE: "bg-orange-50 hover:bg-orange-100",
  CRITICO: "bg-destructive-foreground/80 hover:bg-destructive-foreground",
};

export default function FollowUpsPage() {
  useRequireAuth();
  const queryClient = useQueryClient();

  const [trimesterId, setTrimesterId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [editingCell, setEditingCell] = useState<CellEditorState | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const trimestersQuery = useQuery({
    queryKey: ["trimesters-active"],
    queryFn: () => apiGet<Trimester[]>("/trimesters", { status: "ACTIVE" }),
  });

  const statusesQuery = useQuery({
    queryKey: ["performance-statuses"],
    queryFn: () =>
      apiGet<PerformanceStatus[]>("/performance-statuses", { activeOnly: true }),
  });

  const matrixParams = useMemo(
    () => ({
      trimesterId: trimesterId || undefined,
      groupId: groupId || undefined,
    }),
    [trimesterId, groupId],
  );

  const matrixQuery = useQuery({
    queryKey: ["evaluations-matrix", matrixParams],
    queryFn: () =>
      apiGet<EvaluationMatrixResponse>("/evaluations/matrix", matrixParams),
    enabled: !!trimesterId && !!groupId,
  });

  const evaluationMap = useMemo(() => {
    const map = new Map<string, Evaluation>();
    matrixQuery.data?.evaluations.forEach((ev) => {
      map.set(`${ev.apprenticeId}:${ev.instructorId}`, ev);
    });
    return map;
  }, [matrixQuery.data?.evaluations]);

  const coverage = useMemo(() => {
    const matrix = matrixQuery.data;
    if (!matrix) return null;
    const total = matrix.apprentices.length * matrix.instructors.length;
    const filled = matrix.evaluations.length;
    return { filled, total, pct: total ? Math.round((filled / total) * 100) : 0 };
  }, [matrixQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (data: {
      trimesterId: string;
      groupId: string;
      apprenticeId: string;
      instructorId: string;
      performanceStatusId: string;
      observations: string;
      commitments?: string;
    }) => apiPost<Evaluation>("/evaluations", data),
    onSuccess: () => {
      toast.success("Evaluación guardada");
      setEditingCell(null);
      setSaveError(null);
      queryClient.invalidateQueries({ queryKey: ["evaluations-matrix"] });
    },
    onError: (err) => setSaveError(getApiErrorMessage(err)),
  });

  function openCell(
    apprentice: { id: string; firstName: string; lastName: string },
    instructor: { id: string; fullName: string },
  ) {
    const existing = evaluationMap.get(`${apprentice.id}:${instructor.id}`);
    setSaveError(null);
    setEditingCell({
      apprenticeId: apprentice.id,
      apprenticeName: `${apprentice.firstName} ${apprentice.lastName}`,
      instructorId: instructor.id,
      instructorName: instructor.fullName,
      performanceStatusId:
        existing?.performanceStatusId ?? statusesQuery.data?.[0]?.id ?? "",
      observations: existing?.observations ?? "",
      commitments: existing?.commitments ?? "",
    });
  }

  const canLoadMatrix = !!trimesterId && !!groupId;

  return (
    <div>
      <PageHeader
        breadcrumb="Seguimiento"
        title="Evaluaciones"
        description="Matriz aprendiz × instructor. Clic en una celda para editar."
        actions={
          coverage ? (
            <div className="rounded-md bg-card px-4 py-2 shadow-[var(--shadow-card)] ring-1 ring-border/80">
              <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                Cobertura
              </p>
              <p className="text-lg font-semibold tabular-nums">
                {coverage.filled}/{coverage.total}{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  ({coverage.pct}%)
                </span>
              </p>
            </div>
          ) : undefined
        }
      />

      <div className="mb-4 grid gap-4 rounded-lg bg-card p-4 shadow-[var(--shadow-card)] ring-1 ring-border/80 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="filter-trimester">Trimestre</Label>
          <Select
            id="filter-trimester"
            value={trimesterId}
            onChange={(e) => setTrimesterId(e.target.value)}
          >
            <option value="">Seleccionar trimestre</option>
            {trimestersQuery.data?.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="filter-group">Ficha</Label>
          <GroupSelect
            id="filter-group"
            value={groupId}
            onValueChange={setGroupId}
            status="ACTIVE"
            allowClear
            clearLabel="Seleccionar ficha"
            placeholder="Seleccionar ficha"
          />
        </div>
      </div>

      {statusesQuery.data && statusesQuery.data.length > 0 ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {statusesQuery.data.map((s) => (
            <Badge key={s.id} variant={performanceStatusVariant(s.code)}>
              {s.name}
            </Badge>
          ))}
        </div>
      ) : null}

      {!canLoadMatrix ? (
        <Alert title="Seleccione trimestre y ficha">
          Elija un trimestre y una ficha para cargar la matriz de evaluaciones.
        </Alert>
      ) : (
        <QueryState
          isLoading={matrixQuery.isLoading}
          isError={matrixQuery.isError}
          error={matrixQuery.error}
          data={matrixQuery.data}
          isEmpty={(d) =>
            d.apprentices.length === 0 || d.instructors.length === 0
          }
          emptyIcon={ClipboardList}
          emptyTitle="Matriz vacía"
          emptyDescription="No hay aprendices o instructores asignados al horario de esta ficha."
        >
          {(matrix) => (
            <div className="max-h-[min(75vh,720px)] overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 min-w-[200px] border-b border-r border-border bg-panel/95 px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      Aprendiz
                    </th>
                    {matrix.instructors.map((instructor) => (
                      <th
                        key={instructor.id}
                        className="sticky top-0 z-20 min-w-[140px] border-b border-border bg-panel/95 px-3 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm"
                      >
                        <div className="flex items-center gap-2 normal-case tracking-normal">
                          <Avatar name={instructor.fullName} size="sm" />
                          <span className="line-clamp-2 font-medium text-foreground">
                            {instructor.fullName}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.apprentices.map((apprentice) => {
                    const name = `${apprentice.firstName} ${apprentice.lastName}`;
                    return (
                      <tr key={apprentice.id}>
                        <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-4 py-2">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={name} size="sm" />
                            <span className="font-medium">{name}</span>
                          </div>
                        </td>
                        {matrix.instructors.map((instructor) => {
                          const evaluation = evaluationMap.get(
                            `${apprentice.id}:${instructor.id}`,
                          );
                          const code = evaluation?.performanceStatus?.code ?? "";
                          return (
                            <td
                              key={instructor.id}
                              className="border-b border-border p-1 align-middle"
                            >
                              <button
                                type="button"
                                className={cn(
                                  "flex min-h-[56px] w-full flex-col items-start justify-center rounded-md px-2.5 py-2 text-left text-xs transition-colors",
                                  evaluation
                                    ? cellTone[code] ?? "bg-muted/40 hover:bg-muted"
                                    : "hover:bg-muted/50",
                                )}
                                onClick={() => openCell(apprentice, instructor)}
                              >
                                {evaluation?.performanceStatus ? (
                                  <>
                                    <Badge
                                      variant={performanceStatusVariant(code)}
                                      className="mb-1"
                                    >
                                      {evaluation.performanceStatus.name}
                                    </Badge>
                                    <p className="line-clamp-2 text-muted-foreground">
                                      {evaluation.observations ||
                                        "Sin observaciones"}
                                    </p>
                                  </>
                                ) : (
                                  <span className="text-muted-foreground">+</span>
                                )}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </QueryState>
      )}

      <Dialog
        open={!!editingCell}
        onOpenChange={(open) => {
          if (!open) setEditingCell(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluación</DialogTitle>
            <DialogDescription>
              {editingCell
                ? `${editingCell.apprenticeName} · ${editingCell.instructorName}`
                : ""}
            </DialogDescription>
          </DialogHeader>
          {editingCell ? (
            <>
              <DialogBody className="space-y-4">
                {saveError ? (
                  <Alert variant="destructive">{saveError}</Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="perf-status">Estado de rendimiento</Label>
                  <Select
                    id="perf-status"
                    value={editingCell.performanceStatusId}
                    onChange={(e) =>
                      setEditingCell({
                        ...editingCell,
                        performanceStatusId: e.target.value,
                      })
                    }
                  >
                    {statusesQuery.data?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="observations">Observaciones</Label>
                  <Textarea
                    id="observations"
                    rows={3}
                    value={editingCell.observations}
                    onChange={(e) =>
                      setEditingCell({
                        ...editingCell,
                        observations: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commitments">Compromisos (opcional)</Label>
                  <Textarea
                    id="commitments"
                    rows={2}
                    value={editingCell.commitments}
                    onChange={(e) =>
                      setEditingCell({
                        ...editingCell,
                        commitments: e.target.value,
                      })
                    }
                  />
                </div>
              </DialogBody>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditingCell(null)}
                >
                  Cancelar
                </Button>
                <Button
                  loading={saveMutation.isPending}
                  onClick={() =>
                    saveMutation.mutate({
                      trimesterId,
                      groupId,
                      apprenticeId: editingCell.apprenticeId,
                      instructorId: editingCell.instructorId,
                      performanceStatusId: editingCell.performanceStatusId,
                      observations: editingCell.observations,
                      commitments: editingCell.commitments || undefined,
                    })
                  }
                >
                  Guardar
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
