"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Clock, GraduationCap } from "lucide-react";
import { useRequireAuth } from "@/lib/auth";
import { apiGet } from "@/lib/api";
import type { Apprentice, TimelineEvent } from "@/lib/types";
import { apprenticeStatusLabels, committeeStatusLabels, documentTypeLabels } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { QueryState } from "@/components/query-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { LoadingBlock } from "@/components/ui/spinner";
import { Alert } from "@/components/ui/alert";

function statusLabel(type: TimelineEvent["type"], status: string | null | undefined) {
  if (!status) return null;
  if (type === "WARNING") return committeeStatusLabels[status as keyof typeof committeeStatusLabels] ?? status;
  return status;
}

export default function ApprenticeDetailPage() {
  useRequireAuth();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const apprenticeQuery = useQuery({
    queryKey: ["apprentice", id],
    queryFn: () => apiGet<Apprentice>(`/apprentices/${id}`),
    enabled: !!id,
  });

  const timelineQuery = useQuery({
    queryKey: ["timeline", id],
    queryFn: () => apiGet<TimelineEvent[]>(`/timeline/apprentices/${id}`),
    enabled: !!id,
  });

  if (apprenticeQuery.isLoading) return <LoadingBlock label="Cargando aprendiz..." />;
  if (apprenticeQuery.isError) {
    return (
      <Alert variant="destructive" title="Error">
        No se pudo cargar el aprendiz.
      </Alert>
    );
  }

  const apprentice = apprenticeQuery.data;
  if (!apprentice) return null;

  return (
    <div>
      <div className="mb-6">
        <Link href="/apprentices">
          <Button variant="ghost" size="sm" className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Volver a aprendices
          </Button>
        </Link>
        <PageHeader
          title={`${apprentice.firstName} ${apprentice.lastName}`}
          description={`${documentTypeLabels[apprentice.documentType]} ${apprentice.document}`}
        />
      </div>

      <div className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Estado</p>
            <Badge className="mt-2" variant={apprentice.status === "ACTIVE" ? "success" : "outline"}>
              {apprenticeStatusLabels[apprentice.status]}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Ficha</p>
            <p className="mt-2 font-medium">{apprentice.group?.number ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Correo</p>
            <p className="mt-2 font-medium">{apprentice.email ?? "—"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Teléfono</p>
            <p className="mt-2 font-medium">{apprentice.phone ?? "—"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Línea de tiempo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <QueryState
            isLoading={timelineQuery.isLoading}
            isError={timelineQuery.isError}
            error={timelineQuery.error}
            data={timelineQuery.data}
            isEmpty={(d) => d.length === 0}
            emptyIcon={GraduationCap}
            emptyTitle="Sin eventos registrados"
            emptyDescription="Los seguimientos y llamados aparecerán aquí."
            loadingLabel="Cargando línea de tiempo..."
          >
            {(events) => (
              <ol className="relative space-y-6 border-l border-border pl-6">
                {events.map((event) => (
                  <li key={event.id} className="relative">
                    <span className="absolute -left-[29px] top-1.5 h-3 w-3 rounded-full border-2 border-primary bg-background" />
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{event.title}</p>
                        {event.status ? (
                          <Badge variant="outline">{statusLabel(event.type, event.status)}</Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(event.date, "dd/MM/yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">{event.description}</p>
                      {event.commitments ? (
                        <p className="text-sm">
                          <span className="font-medium">Compromisos:</span> {event.commitments}
                        </p>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </QueryState>
        </CardContent>
      </Card>
    </div>
  );
}
