"use client";



import { useQuery } from "@tanstack/react-query";

import { FileText } from "lucide-react";

import { useState } from "react";

import { toast } from "sonner";

import { useRequireAuth } from "@/lib/auth";

import { apiGet, downloadPdf } from "@/lib/api";

import type { Group, PaginatedResult, Trimester, User } from "@/lib/types";

import { getApiErrorMessage } from "@/lib/utils";

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

  const [loading, setLoading] = useState<string | null>(null);



  const trimestersQuery = useQuery({

    queryKey: ["trimesters-all"],

    queryFn: () => apiGet<Trimester[]>("/trimesters"),

  });



  const groupsQuery = useQuery({

    queryKey: ["groups-options"],

    queryFn: () => apiGet<PaginatedResult<Group>>("/groups", { limit: 100 }),

  });



  const instructorsQuery = useQuery({

    queryKey: ["instructors"],

    queryFn: () => apiGet<User[]>("/users/instructors"),

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



  const groupReportsReady = !!trimesterId && !!groupId;

  const instructorReportReady = !!trimesterId && !!instructorId;



  return (

    <div>

      <PageHeader

        breadcrumb="Seguimiento"

        title="Reportes"

        description="Descargue reportes PDF de seguimiento y horarios por ficha o instructor."

      />



      <div className="mb-8 grid gap-4 sm:grid-cols-3">

        <div className="space-y-2">

          <Label htmlFor="trimester">Trimestre</Label>

          <Select id="trimester" value={trimesterId} onChange={(e) => setTrimesterId(e.target.value)}>

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

          <Select id="group" value={groupId} onChange={(e) => setGroupId(e.target.value)}>

            <option value="">Seleccionar ficha</option>

            {groupsQuery.data?.items.map((g) => (

              <option key={g.id} value={g.id}>

                {g.number}

              </option>

            ))}

          </Select>

        </div>

        <div className="space-y-2">

          <Label htmlFor="instructor">Instructor</Label>

          <Select id="instructor" value={instructorId} onChange={(e) => setInstructorId(e.target.value)}>

            <option value="">Seleccionar instructor</option>

            {instructorsQuery.data?.map((i) => (

              <option key={i.id} value={i.id}>

                {i.fullName}

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

                Matriz de evaluaciones del trimestre para la ficha seleccionada.

              </p>

              <div className="flex flex-wrap gap-2">

                <Button

                  size="sm"

                  disabled={!groupReportsReady}

                  loading={loading === "eval-download"}

                  onClick={() =>

                    handleDownload("eval-download", "/reports/evaluations/group", {

                      trimesterId,

                      groupId,

                    })

                  }

                >

                  Descargar

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

                    handleDownload("sched-group-download", "/reports/schedules/group", {

                      trimesterId,

                      groupId,

                    })

                  }

                >

                  Descargar

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

                    handleDownload("sched-instructor-download", "/reports/schedules/instructor", {

                      trimesterId,

                      instructorId,

                    })

                  }

                >

                  Descargar

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

              </div>

            </CardContent>

          </Card>

        </div>

      )}

    </div>

  );

}

