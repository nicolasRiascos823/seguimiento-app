"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth, useRequireAuth } from "@/lib/auth";
import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/api";
import type {
  CalendarResponse,
  Environment,
  Schedule,
  Trimester,
  User,
  WeekDay,
} from "@/lib/types";
import { weekDayLabels, weekDays } from "@/lib/labels";
import { cn, colorFromId, getApiErrorMessage } from "@/lib/utils";
import { GroupSelect } from "@/components/group-select";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
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

type ScheduleViewMode = "group" | "instructor" | "environment";

interface ScheduleFormState {
  weekDay: WeekDay;
  blockStart: string;
  blockEnd: string;
  schedule?: Schedule;
}

interface SchedulesCalendarViewProps {
  mode: ScheduleViewMode;
}

export function SchedulesCalendarView({ mode }: SchedulesCalendarViewProps) {
  const { user } = useAuth();
  useRequireAuth();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [trimesterId, setTrimesterId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [instructorId, setInstructorId] = useState(
    !isAdmin && user?.role === "INSTRUCTOR" ? user.id : "",
  );
  const [environmentId, setEnvironmentId] = useState("");
  const [formState, setFormState] = useState<ScheduleFormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formGroupId, setFormGroupId] = useState("");
  const [formInstructorId, setFormInstructorId] = useState("");
  const [formEnvironmentId, setFormEnvironmentId] = useState("");

  const isGroupMode = mode === "group";
  const isInstructorMode = mode === "instructor";
  const isEnvironmentMode = mode === "environment";
  const selectionReady = isGroupMode
    ? !!groupId
    : isInstructorMode
      ? !!instructorId
      : !!environmentId;

  const trimestersQuery = useQuery({
    queryKey: ["trimesters-active"],
    queryFn: () => apiGet<Trimester[]>("/trimesters", { status: "ACTIVE" }),
  });
  const instructorsQuery = useQuery({
    queryKey: ["instructors"],
    queryFn: () => apiGet<User[]>("/users/instructors"),
    enabled: isAdmin || isGroupMode || isEnvironmentMode,
  });
  const environmentsQuery = useQuery({
    queryKey: ["environments-active"],
    queryFn: () => apiGet<Environment[]>("/environments", { activeOnly: true }),
    enabled: isEnvironmentMode || (isAdmin && !!formState),
  });

  const calendarParams = useMemo(
    () => ({
      trimesterId: trimesterId || undefined,
      groupId: isGroupMode ? groupId || undefined : undefined,
      instructorId: isInstructorMode ? instructorId || undefined : undefined,
      environmentId: isEnvironmentMode
        ? environmentId || undefined
        : undefined,
    }),
    [
      trimesterId,
      groupId,
      instructorId,
      environmentId,
      isGroupMode,
      isInstructorMode,
      isEnvironmentMode,
    ],
  );

  const calendarQuery = useQuery({
    queryKey: ["schedules-calendar", mode, calendarParams],
    queryFn: () => apiGet<CalendarResponse>("/schedules/calendar", calendarParams),
    enabled: !!trimesterId && selectionReady,
  });

  const createMutation = useMutation({
    mutationFn: (body: {
      trimesterId: string;
      groupId: string;
      instructorId: string;
      environmentId: string;
      weekDay: WeekDay;
      blockStart: string;
      blockEnd: string;
    }) => apiPost<Schedule[]>("/schedules", body),
    onSuccess: (created) => {
      const count = Array.isArray(created) ? created.length : 1;
      toast.success(
        count > 1 ? `Se crearon ${count} bloques horarios` : "Horario creado",
      );
      setFormState(null);
      queryClient.invalidateQueries({ queryKey: ["schedules-calendar"] });
    },
    onError: (err) => setFormError(getApiErrorMessage(err)),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => apiPatch<Schedule>(`/schedules/${id}/deactivate`),
    onSuccess: () => {
      toast.success("Horario desactivado");
      setFormState(null);
      queryClient.invalidateQueries({ queryKey: ["schedules-calendar"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiDelete<{ deleted: boolean }>(`/schedules/${id}`),
    onSuccess: () => {
      toast.success("Horario eliminado");
      setFormState(null);
      queryClient.invalidateQueries({ queryKey: ["schedules-calendar"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err)),
  });

  const timeBlocks = useMemo(
    () => calendarQuery.data?.timeBlocks ?? [],
    [calendarQuery.data?.timeBlocks],
  );

  const programmedHours = useMemo(() => {
    const schedules = calendarQuery.data?.schedules ?? [];
    return schedules.filter((s) => s.status === "ACTIVE").length;
  }, [calendarQuery.data?.schedules]);

  const hoursByDay = useMemo(() => {
    const schedules = (calendarQuery.data?.schedules ?? []).filter(
      (s) => s.status === "ACTIVE",
    );
    return weekDays.map((day) => ({
      day,
      hours: schedules.filter((s) => s.weekDay === day).length,
    }));
  }, [calendarQuery.data?.schedules]);

  const endOptions = useMemo(() => {
    if (!formState) return [];
    return timeBlocks
      .filter((b) => b.end > formState.blockStart)
      .map((b) => ({ value: b.end, label: b.end }));
  }, [formState, timeBlocks]);

  function openCreate(weekDay: WeekDay, blockStart: string) {
    if (!isAdmin) return;
    setFormError(null);
    setFormGroupId(isGroupMode ? groupId : "");
    setFormInstructorId(isInstructorMode ? instructorId : "");
    setFormEnvironmentId(isEnvironmentMode ? environmentId : "");
    const startIdx = timeBlocks.findIndex((b) => b.start === blockStart);
    const defaultEnd =
      timeBlocks[
        Math.min(Math.max(startIdx, 0) + 1, Math.max(timeBlocks.length - 1, 0))
      ]?.end ??
      timeBlocks[0]?.end ??
      "09:00";
    setFormState({ weekDay, blockStart, blockEnd: defaultEnd });
  }

  function openEdit(schedule: Schedule) {
    if (!isAdmin) return;
    setFormError(null);
    setFormGroupId(schedule.groupId);
    setFormInstructorId(schedule.instructorId);
    setFormEnvironmentId(schedule.environmentId);
    const end =
      timeBlocks.find((b) => b.start === schedule.blockStart)?.end ??
      schedule.blockStart;
    setFormState({
      weekDay: schedule.weekDay,
      blockStart: schedule.blockStart,
      blockEnd: end,
      schedule,
    });
  }

  const title = isGroupMode
    ? "Horario por ficha"
    : isInstructorMode
      ? "Horario por instructor"
      : "Horario por ambiente";
  const description = isGroupMode
    ? "Programación semanal filtrada por ficha."
    : isInstructorMode
      ? "Programación semanal filtrada por instructor."
      : "Programación semanal filtrada por ambiente.";
  const emptyPrompt = !trimesterId
    ? "Elija un trimestre activo para continuar."
    : isGroupMode
      ? "Seleccione una ficha para ver su horario."
      : isInstructorMode
        ? "Seleccione un instructor para ver su horario."
        : "Seleccione un ambiente para ver su horario.";
  const emptyDescription = isGroupMode
    ? "Esta ficha aún no tiene bloques programados en el trimestre."
    : isInstructorMode
      ? "Este instructor aún no tiene bloques programados en el trimestre."
      : "Este ambiente aún no tiene bloques programados en el trimestre.";

  return (
    <div>
      <PageHeader
        breadcrumb="Programación"
        title={title}
        description={description}
        actions={
          (isInstructorMode &&
            trimesterId &&
            selectionReady &&
            calendarQuery.data) ||
          (isAdmin && trimesterId && selectionReady) ? (
            <>
              {isInstructorMode &&
              trimesterId &&
              selectionReady &&
              calendarQuery.data ? (
                <div className="rounded-md bg-card px-4 py-2 shadow-[var(--shadow-card)] ring-1 ring-border/80">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                    Horas programadas
                  </p>
                  <p className="text-2xl font-semibold tabular-nums text-foreground">
                    {programmedHours}
                    <span className="ml-1 text-sm font-medium text-muted-foreground">
                      h / semana
                    </span>
                  </p>
                </div>
              ) : null}
              {isAdmin && trimesterId && selectionReady ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    openCreate("MONDAY", timeBlocks[0]?.start ?? "08:00")
                  }
                >
                  Agregar
                </Button>
              ) : null}
            </>
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

        {isGroupMode ? (
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
        ) : isInstructorMode ? (
          <div className="space-y-2">
            <Label htmlFor="filter-instructor">Instructor</Label>
            <Select
              id="filter-instructor"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              disabled={!isAdmin}
            >
              <option value="">Seleccionar instructor</option>
              {isAdmin
                ? instructorsQuery.data?.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.fullName}
                    </option>
                  ))
                : user ? (
                    <option value={user.id}>{user.fullName}</option>
                  ) : null}
            </Select>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="filter-environment">Ambiente</Label>
            <Select
              id="filter-environment"
              value={environmentId}
              onChange={(e) => setEnvironmentId(e.target.value)}
            >
              <option value="">Seleccionar ambiente</option>
              {environmentsQuery.data?.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      {isInstructorMode && trimesterId && selectionReady && calendarQuery.data ? (
        <div className="mb-4 flex flex-wrap gap-2">
          {hoursByDay.map(({ day, hours }) => (
            <div
              key={day}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs ring-1 ring-border/80",
                hours > 10
                  ? "bg-destructive-foreground text-destructive"
                  : hours > 0
                    ? "bg-card text-foreground"
                    : "bg-transparent text-muted-foreground",
              )}
            >
              <span className="font-medium">{weekDayLabels[day]}</span>
              <span className="ml-1.5 tabular-nums">{hours} h</span>
            </div>
          ))}
        </div>
      ) : null}

      {!trimesterId || !selectionReady ? (
        <Alert title="Seleccione filtros">
          {emptyPrompt}
        </Alert>
      ) : (
        <QueryState
          isLoading={calendarQuery.isLoading}
          isError={calendarQuery.isError}
          error={calendarQuery.error}
          data={calendarQuery.data}
          emptyIcon={CalendarDays}
          emptyTitle="Sin horarios"
          emptyDescription={emptyDescription}
          loadingLabel="Cargando horarios..."
        >
          {(calendar) => (
            <div className="max-h-[min(75vh,720px)] overflow-auto rounded-lg bg-card shadow-[var(--shadow-card)] ring-1 ring-border/80">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-30 min-w-[72px] border-b border-r border-border bg-panel/95 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm">
                      Hora
                    </th>
                    {weekDays.map((day) => (
                      <th
                        key={day}
                        className="sticky top-0 z-20 min-w-[140px] border-b border-border bg-panel/95 px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-sm"
                      >
                        {weekDayLabels[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeBlocks.map((block) => (
                    <tr key={block.start}>
                      <td className="sticky left-0 z-10 border-b border-r border-border bg-card px-3 py-2 tabular-nums text-xs font-medium text-muted-foreground">
                        {block.label}
                      </td>
                      {weekDays.map((day) => {
                        const dayData = calendar.days.find((d) => d.weekDay === day);
                        const cell = dayData?.blocks.find(
                          (b) => b.blockStart === block.start,
                        );
                        const schedules = (cell?.schedules ?? []).filter(
                          (s) => s.status === "ACTIVE",
                        );
                        return (
                          <td
                            key={`${day}-${block.start}`}
                            className="border-b border-border align-top p-1"
                          >
                            {schedules.length === 0 ? (
                              isAdmin ? (
                                <button
                                  type="button"
                                  className="flex h-full min-h-[52px] w-full items-center justify-center rounded-md px-1 text-xs text-muted-foreground transition-colors hover:bg-muted/60"
                                  onClick={() => openCreate(day, block.start)}
                                >
                                  +
                                </button>
                              ) : (
                                <div className="min-h-[52px]" />
                              )
                            ) : (
                              <div className="space-y-1">
                                {schedules.map((schedule) => {
                                  const colorKey = isGroupMode
                                    ? schedule.instructorId
                                    : isInstructorMode
                                      ? schedule.groupId
                                      : schedule.groupId;
                                  const colors = colorFromId(colorKey);
                                  return (
                                    <button
                                      key={schedule.id}
                                      type="button"
                                      className="w-full rounded-md px-2 py-1.5 text-left text-xs transition-opacity hover:opacity-90"
                                      style={{
                                        backgroundColor: colors.bg,
                                        color: colors.text,
                                        boxShadow: `inset 3px 0 0 ${colors.border}`,
                                      }}
                                      onClick={() => openEdit(schedule)}
                                      disabled={!isAdmin}
                                    >
                                      {isGroupMode ? (
                                        <>
                                          <p className="font-semibold">
                                            {schedule.instructor?.fullName ?? "—"}
                                          </p>
                                          <p className="opacity-80">
                                            {schedule.environment?.name ?? "—"}
                                          </p>
                                        </>
                                      ) : isInstructorMode ? (
                                        <>
                                          <p className="font-semibold">
                                            Ficha {schedule.group?.number ?? "—"}
                                          </p>
                                          <p className="opacity-80">
                                            {schedule.environment?.name ?? "—"}
                                          </p>
                                        </>
                                      ) : (
                                        <>
                                          <p className="font-semibold">
                                            Ficha {schedule.group?.number ?? "—"}
                                          </p>
                                          <p className="opacity-80">
                                            {schedule.instructor?.fullName ?? "—"}
                                          </p>
                                        </>
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryState>
      )}

      <Dialog
        open={!!formState && isAdmin}
        onOpenChange={(open) => {
          if (!open) setFormState(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formState?.schedule ? "Editar horario" : "Nuevo horario"}
            </DialogTitle>
            <DialogDescription>
              {formState?.schedule
                ? "Desactive o elimine el bloque seleccionado."
                : "Defina un rango horario; se crearán bloques de 1 hora."}
            </DialogDescription>
          </DialogHeader>
          {formState ? (
            <>
              <DialogBody className="space-y-4">
                {formError ? (
                  <Alert variant="destructive">{formError}</Alert>
                ) : null}

                {!formState.schedule ? (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="form-day">Día</Label>
                      <Select
                        id="form-day"
                        value={formState.weekDay}
                        onChange={(e) =>
                          setFormState((s) =>
                            s ? { ...s, weekDay: e.target.value as WeekDay } : s,
                          )
                        }
                      >
                        {weekDays.map((day) => (
                          <option key={day} value={day}>
                            {weekDayLabels[day]}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="form-start">Hora inicio</Label>
                        <Select
                          id="form-start"
                          value={formState.blockStart}
                          onChange={(e) => {
                            const nextStart = e.target.value;
                            setFormState((s) => {
                              if (!s) return s;
                              const nextEnds = timeBlocks
                                .filter((b) => b.end > nextStart)
                                .map((b) => b.end);
                              const blockEnd = nextEnds.includes(s.blockEnd)
                                ? s.blockEnd
                                : (nextEnds[0] ?? s.blockEnd);
                              return { ...s, blockStart: nextStart, blockEnd };
                            });
                          }}
                        >
                          {timeBlocks.map((b) => (
                            <option key={b.start} value={b.start}>
                              {b.start}
                            </option>
                          ))}
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="form-end">Hora fin</Label>
                        <Select
                          id="form-end"
                          value={formState.blockEnd}
                          onChange={(e) =>
                            setFormState((s) =>
                              s ? { ...s, blockEnd: e.target.value } : s,
                            )
                          }
                        >
                          {endOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Se crearán bloques de 1 hora desde {formState.blockStart}{" "}
                      hasta {formState.blockEnd}.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {weekDayLabels[formState.weekDay]} · {formState.blockStart}{" "}
                    - {formState.blockEnd}
                  </p>
                )}

                <div className="space-y-2">
                  <Label htmlFor="form-group">Ficha</Label>
                  <GroupSelect
                    id="form-group"
                    value={formGroupId}
                    onValueChange={setFormGroupId}
                    status="ACTIVE"
                    placeholder="Seleccionar ficha"
                    disabled={!!formState.schedule || (isGroupMode && !!groupId)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-instructor">Instructor</Label>
                  <Select
                    id="form-instructor"
                    value={formInstructorId}
                    onChange={(e) => setFormInstructorId(e.target.value)}
                    disabled={
                      !!formState.schedule ||
                      (isInstructorMode && !!instructorId)
                    }
                  >
                    <option value="" disabled>
                      Seleccionar instructor
                    </option>
                    {instructorsQuery.data?.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.fullName}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="form-environment">Ambiente</Label>
                  <Select
                    id="form-environment"
                    value={formEnvironmentId}
                    onChange={(e) => setFormEnvironmentId(e.target.value)}
                    disabled={
                      !!formState.schedule ||
                      (isEnvironmentMode && !!environmentId)
                    }
                  >
                    <option value="" disabled>
                      Seleccionar ambiente
                    </option>
                    {environmentsQuery.data?.map((env) => (
                      <option key={env.id} value={env.id}>
                        {env.name}
                      </option>
                    ))}
                  </Select>
                </div>
                {formState.schedule?.status === "INACTIVE" ? (
                  <Badge variant="outline">Inactivo</Badge>
                ) : null}
              </DialogBody>
              <DialogFooter>
                <Button variant="outline" onClick={() => setFormState(null)}>
                  Cancelar
                </Button>
                {!formState.schedule ? (
                  <Button
                    loading={createMutation.isPending}
                    onClick={() => {
                      setFormError(null);
                      if (
                        !trimesterId ||
                        !formGroupId ||
                        !formInstructorId ||
                        !formEnvironmentId ||
                        !formState.blockStart ||
                        !formState.blockEnd
                      ) {
                        setFormError("Complete todos los campos");
                        return;
                      }
                      if (formState.blockEnd <= formState.blockStart) {
                        setFormError(
                          "La hora de fin debe ser posterior a la de inicio",
                        );
                        return;
                      }
                      createMutation.mutate({
                        trimesterId,
                        groupId: formGroupId,
                        instructorId: formInstructorId,
                        environmentId: formEnvironmentId,
                        weekDay: formState.weekDay,
                        blockStart: formState.blockStart,
                        blockEnd: formState.blockEnd,
                      });
                    }}
                  >
                    Crear rango
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      loading={deactivateMutation.isPending}
                      onClick={() =>
                        deactivateMutation.mutate(formState.schedule!.id)
                      }
                    >
                      Desactivar
                    </Button>
                    <Button
                      variant="destructive"
                      loading={deleteMutation.isPending}
                      onClick={() =>
                        deleteMutation.mutate(formState.schedule!.id)
                      }
                    >
                      Eliminar
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
