"use client";

import { useQuery } from "@tanstack/react-query";
import { FileSpreadsheet, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, downloadFile, downloadPdf } from "@/lib/api";
import type { Environment, Trimester, User } from "@/lib/types";
import { getApiErrorMessage } from "@/lib/utils";
import { GroupSelect } from "@/components/group-select";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/ui/page-header";
import { Select } from "@/components/ui/select";

export default function ReportsPage() {
  useRequireAuth();
  const [trimesterId, setTrimesterId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [environmentId, setEnvironmentId] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const trimestersQuery = useQuery({
    queryKey: ["trimesters-all"],
    queryFn: () => apiGet<Trimester[]>("/trimesters"),
  });

  const instructorsQuery = useQuery({
    queryKey: ["instructors"],
    queryFn: () => apiGet<User[]>("/users/instructors"),
  });

  const environmentsQuery = useQuery({
    queryKey: ["environments-active"],
    queryFn: () => apiGet<Environment[]>("/environments", { activeOnly: true }),
  });

  async function handleDownload(
    key: string,
    url: string,
    params: Record<string, string>,
    mode: "download" | "open" = "download",
  ) {
    setLoading(key);
    try {
      await downloadPdf(url, params, mode);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudo generar el reporte"));
    } finally {
      setLoading(null);
    }
  }

  async function handleExcel(
    key: string,
    url: string,
    params: Record<string, string>,
    filename: string,
  ) {
    setLoading(key);
    try {
      await downloadFile(url, params, filename);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudo generar el Excel"));
    } finally {
      setLoading(null);
    }
  }

  const groupReportsReady = !!trimesterId && !!groupId;
  const instructorReportReady = !!trimesterId && !!instructorId;
  const environmentReportReady = !!trimesterId && !!environmentId;

  return (
    <div>
      <PageHeader
        breadcrumb="Seguimiento"
        title="Reportes"
        description="Descargue reportes PDF o Excel de seguimiento y horarios por ficha, instructor o ambiente."
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label htmlFor="trimester">Trimestre</Label>
          <Select
            id="trimester"
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
          <Label htmlFor="group">Ficha</Label>
          <GroupSelect
            id="group"
            value={groupId}
            onValueChange={setGroupId}
            allowClear
            clearLabel="Seleccionar ficha"
            placeholder="Seleccionar ficha"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="instructor">Instructor</Label>
          <Select
            id="instructor"
            value={instructorId}
            onChange={(e) => setInstructorId(e.target.value)}
          >
            <option value="">Seleccionar instructor</option>
            {instructorsQuery.data?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.fullName}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="environment">Ambiente</Label>
          <Select
            id="environment"
            value={environmentId}
            onChange={(e) => setEnvironmentId(e.target.value)}
          >
            <option value="">Seleccionar ambiente</option>
            {environmentsQuery.data?.map((env) => (
              <option key={env.id} value={env.id}>
                {env.name}
                {env.isVirtual ? " (Virtual)" : ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!trimesterId ? (
        <Alert title="Seleccione un trimestre">
          Elija un trimestre para habilitar la descarga de reportes.
        </Alert>
      ) : (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Horarios del trimestre (todas)
            </h2>
            <p className="text-sm text-muted-foreground">
              PDF o Excel con todos los horarios activos del trimestre. En Excel
              cada ficha, instructor o ambiente va en su propia hoja.
            </p>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Todas las fichas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Incluye el horario semanal de cada ficha con programación
                    en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      loading={loading === "sched-all-groups-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-groups-download",
                          "/reports/schedules/groups",
                          { trimesterId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading === "sched-all-groups-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-groups-open",
                          "/reports/schedules/groups",
                          { trimesterId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loading === "sched-all-groups-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-all-groups-excel",
                          "/reports/schedules/groups/excel",
                          { trimesterId },
                          "horarios-fichas.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Todos los instructores
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Incluye el horario semanal de cada instructor con bloques
                    asignados en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      loading={loading === "sched-all-instructors-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-instructors-download",
                          "/reports/schedules/instructors",
                          { trimesterId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading === "sched-all-instructors-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-instructors-open",
                          "/reports/schedules/instructors",
                          { trimesterId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loading === "sched-all-instructors-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-all-instructors-excel",
                          "/reports/schedules/instructors/excel",
                          { trimesterId },
                          "horarios-instructores.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Todos los ambientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Incluye el horario semanal de cada ambiente con
                    programación en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      loading={loading === "sched-all-environments-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-environments-download",
                          "/reports/schedules/environments",
                          { trimesterId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      loading={loading === "sched-all-environments-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-all-environments-open",
                          "/reports/schedules/environments",
                          { trimesterId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={loading === "sched-all-environments-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-all-environments-excel",
                          "/reports/schedules/environments/excel",
                          { trimesterId },
                          "horarios-ambientes.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              Reportes individuales
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Seguimiento por ficha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Matriz de evaluaciones del trimestre para la ficha
                    seleccionada.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!groupReportsReady}
                      loading={loading === "eval-download"}
                      onClick={() =>
                        handleDownload(
                          "eval-download",
                          "/reports/evaluations/group",
                          { trimesterId, groupId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!groupReportsReady}
                      loading={loading === "eval-open"}
                      onClick={() =>
                        handleDownload(
                          "eval-open",
                          "/reports/evaluations/group",
                          { trimesterId, groupId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Horario por ficha
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Programación semanal de la ficha en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!groupReportsReady}
                      loading={loading === "sched-group-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-group-download",
                          "/reports/schedules/group",
                          { trimesterId, groupId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!groupReportsReady}
                      loading={loading === "sched-group-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-group-open",
                          "/reports/schedules/group",
                          { trimesterId, groupId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!groupReportsReady}
                      loading={loading === "sched-group-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-group-excel",
                          "/reports/schedules/group/excel",
                          { trimesterId, groupId },
                          "horario-ficha.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Horario por instructor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Programación semanal del instructor en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!instructorReportReady}
                      loading={loading === "sched-instructor-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-instructor-download",
                          "/reports/schedules/instructor",
                          { trimesterId, instructorId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!instructorReportReady}
                      loading={loading === "sched-instructor-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-instructor-open",
                          "/reports/schedules/instructor",
                          { trimesterId, instructorId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!instructorReportReady}
                      loading={loading === "sched-instructor-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-instructor-excel",
                          "/reports/schedules/instructor/excel",
                          { trimesterId, instructorId },
                          "horario-instructor.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="h-4 w-4 text-primary" />
                    Horario por ambiente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Programación semanal del ambiente en el trimestre.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={!environmentReportReady}
                      loading={loading === "sched-environment-download"}
                      onClick={() =>
                        handleDownload(
                          "sched-environment-download",
                          "/reports/schedules/environment",
                          { trimesterId, environmentId },
                        )
                      }
                    >
                      Descargar PDF
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!environmentReportReady}
                      loading={loading === "sched-environment-open"}
                      onClick={() =>
                        handleDownload(
                          "sched-environment-open",
                          "/reports/schedules/environment",
                          { trimesterId, environmentId },
                          "open",
                        )
                      }
                    >
                      Abrir
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!environmentReportReady}
                      loading={loading === "sched-environment-excel"}
                      onClick={() =>
                        handleExcel(
                          "sched-environment-excel",
                          "/reports/schedules/environment/excel",
                          { trimesterId, environmentId },
                          "horario-ambiente.xlsx",
                        )
                      }
                    >
                      <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" />
                      Excel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
