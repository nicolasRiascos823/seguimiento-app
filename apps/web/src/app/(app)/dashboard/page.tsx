"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { apiGet } from "@/lib/api";
import type { DashboardResponse } from "@/lib/types";
import {
  callNumberLabels,
  committeeStatusLabels,
  performanceStatusVariant,
} from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import { QueryState } from "@/components/query-state";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";

function AlertItem({
  tone,
  title,
  meta,
  href,
}: {
  tone: "danger" | "warning" | "info" | "muted";
  title: string;
  meta: string;
  href?: string;
}) {
  const toneClass = {
    danger: "border-l-destructive bg-destructive-foreground/60",
    warning: "border-l-warning bg-warning-foreground/50",
    info: "border-l-info bg-info-foreground/50",
    muted: "border-l-border bg-muted/40",
  }[tone];

  const content = (
    <div
      className={`flex items-start gap-3 rounded-md border-l-[3px] px-3 py-3 transition-colors ${toneClass} ${href ? "hover:bg-white" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{meta}</p>
      </div>
      {href ? (
        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
    </div>
  );

  return href ? (
    <Link href={href} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const query = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiGet<DashboardResponse>("/dashboard"),
  });

  const chartData = useMemo(() => {
    if (!query.data) return [];
    return [
      {
        name: "Críticos",
        value: query.data.indicators.criticalApprentices,
        fill: "#A32020",
      },
      {
        name: "2.º llamado",
        value: query.data.indicators.secondCallApprentices,
        fill: "#7A5B00",
      },
      {
        name: "Comités",
        value: query.data.indicators.pendingCommittees,
        fill: "#00304D",
      },
      {
        name: "Sin seg.",
        value: query.data.indicators.groupsPendingFollowUp,
        fill: "#71277A",
      },
    ];
  }, [query.data]);

  return (
    <div>
      <PageHeader
        breadcrumb="Operación"
        title="Panel"
        description={
          user
            ? `Resumen operativo · ${user.fullName}`
            : "Resumen operativo del seguimiento académico"
        }
      />

      <QueryState
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        data={query.data}
        emptyTitle="Sin datos todavía"
        emptyDescription="Cuando existan trimestres activos y registros, aparecerán aquí."
        loadingFallback={<DashboardSkeleton />}
      >
        {(data) => (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {data.activeTrimester ? (
                <p className="text-sm text-muted-foreground">
                  Trimestre activo:{" "}
                  <span className="font-medium text-foreground">
                    {data.activeTrimester.name}
                  </span>{" "}
                  <span className="text-muted-foreground">
                    ({formatDate(data.activeTrimester.startDate)} –{" "}
                    {formatDate(data.activeTrimester.endDate)})
                  </span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No hay trimestre activo configurado.
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Aprendices críticos"
                value={data.indicators.criticalApprentices}
                icon={GraduationCap}
                tone="danger"
                hint="Requieren atención inmediata"
              />
              <StatCard
                label="Segundo llamado"
                value={data.indicators.secondCallApprentices}
                icon={AlertTriangle}
                tone="warning"
              />
              <StatCard
                label="Comités pendientes"
                value={data.indicators.pendingCommittees}
                icon={ClipboardList}
                tone="info"
              />
              <StatCard
                label="Fichas sin seguimiento"
                value={data.indicators.groupsPendingFollowUp}
                icon={UsersRound}
                tone="stat"
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-5">
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Distribución de alertas</CardTitle>
                </CardHeader>
                <CardContent className="h-64 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} barSize={36}>
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 12, fill: "#5a6b62" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12, fill: "#5a6b62" }}
                        axisLine={false}
                        tickLine={false}
                        width={28}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(0,120,50,0.06)" }}
                        contentStyle={{
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {chartData.map((entry) => (
                          <Cell key={entry.name} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Prioridad alta</CardTitle>
                  <Link
                    href="/warnings"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ver llamados
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.secondCall.length === 0 &&
                  data.alerts.critical.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      Sin alertas críticas en este momento.
                    </p>
                  ) : (
                    <>
                      {data.alerts.secondCall.slice(0, 4).map((item) => {
                        const name = item.apprentice
                          ? `${item.apprentice.firstName} ${item.apprentice.lastName}`
                          : "Aprendiz";
                        return (
                          <AlertItem
                            key={`sc-${item.id}`}
                            tone="warning"
                            title={name}
                            meta={`2.º llamado · ${formatDate(item.date)}`}
                            href={
                              item.apprentice
                                ? `/apprentices/${item.apprentice.id}`
                                : "/warnings"
                            }
                          />
                        );
                      })}
                      {data.alerts.critical.slice(0, 4).map((item) => {
                        const name = item.apprentice
                          ? `${item.apprentice.firstName} ${item.apprentice.lastName}`
                          : "Aprendiz";
                        return (
                          <AlertItem
                            key={`cr-${item.id}`}
                            tone="danger"
                            title={name}
                            meta={`${item.instructor?.fullName ?? "Instructor"} · ${item.performanceStatus?.name ?? "Crítico"}`}
                            href="/follow-ups"
                          />
                        );
                      })}
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Comités pendientes</CardTitle>
                  <Badge variant="warning">
                    {data.alerts.pendingCommittees.length}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.pendingCommittees.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Sin comités pendientes.
                    </p>
                  ) : (
                    data.alerts.pendingCommittees.slice(0, 6).map((item) => {
                      const name = item.apprentice
                        ? `${item.apprentice.firstName} ${item.apprentice.lastName}`
                        : "Aprendiz";
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                        >
                          <Avatar name={name} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.callNumber
                                ? callNumberLabels[item.callNumber]
                                : "Llamado"}
                            </p>
                          </div>
                          <Badge variant="warning">
                            {committeeStatusLabels[item.committeeStatus]}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex-row items-center justify-between space-y-0">
                  <CardTitle>Fichas sin seguimiento</CardTitle>
                  <Link
                    href="/follow-ups"
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Ir a seguimiento
                  </Link>
                </CardHeader>
                <CardContent className="space-y-2">
                  {data.alerts.groupsWithoutFollowUp.length === 0 ? (
                    <p className="py-6 text-center text-sm text-muted-foreground">
                      Todas las fichas tienen evaluaciones registradas.
                    </p>
                  ) : (
                    data.alerts.groupsWithoutFollowUp.slice(0, 6).map((group) => (
                      <div
                        key={group.id}
                        className="flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-muted/50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-stat-foreground text-xs font-semibold text-stat">
                          {group.number.slice(-2)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">Ficha {group.number}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {group.leader?.fullName ?? "Sin líder asignado"}
                          </p>
                        </div>
                        <Badge variant="stat">Pendiente</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            {data.alerts.critical.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle>Evaluaciones críticas recientes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 p-0 pb-3">
                  {data.alerts.critical.slice(0, 8).map((item) => {
                    const name = item.apprentice
                      ? `${item.apprentice.firstName} ${item.apprentice.lastName}`
                      : "—";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 border-b border-border/60 px-5 py-3 last:border-0"
                      >
                        <Avatar name={name} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {item.instructor?.fullName ?? "—"}
                          </p>
                        </div>
                        {item.performanceStatus ? (
                          <Badge
                            variant={performanceStatusVariant(
                              item.performanceStatus.code,
                            )}
                          >
                            {item.performanceStatus.name}
                          </Badge>
                        ) : null}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : null}
          </div>
        )}
      </QueryState>
    </div>
  );
}
