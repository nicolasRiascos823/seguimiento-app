"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useRequireAuth } from "@/lib/auth";
import { apiGet, apiUpload } from "@/lib/api";
import type { ImportBatch } from "@/lib/types";
import { formatDate, getApiErrorMessage } from "@/lib/utils";
import { QueryState } from "@/components/query-state";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const batchStatusLabels: Record<ImportBatch["status"], string> = {
  PENDING: "Pendiente",
  COMPLETED: "Completado",
  FAILED: "Fallido",
};

export default function ImportApprenticesPage() {
  useRequireAuth(["ADMIN"]);
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const batchesQuery = useQuery({
    queryKey: ["import-batches"],
    queryFn: () => apiGet<ImportBatch[]>("/imports/batches"),
  });

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return apiUpload<ImportBatch>("/imports/apprentices", formData);
    },
    onSuccess: (batch) => {
      toast.success(`Importación procesada: ${batch.successRows} registros exitosos`);
      setError(null);
      if (fileRef.current) fileRef.current.value = "";
      queryClient.invalidateQueries({ queryKey: ["import-batches"] });
      queryClient.invalidateQueries({ queryKey: ["apprentices"] });
    },
    onError: (err) => setError(getApiErrorMessage(err)),
  });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    importMutation.mutate(file);
  }

  return (
    <div>
      <PageHeader
        title="Importar aprendices"
        description="Cargue un archivo CSV o Excel con la información de los aprendices."
      />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Archivo de importación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-md file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
              onChange={handleFileChange}
              disabled={importMutation.isPending}
            />
            {importMutation.isPending ? (
              <p className="text-sm text-muted-foreground">Procesando archivo...</p>
            ) : null}
          </div>
          <Alert title="Formato esperado">
            El archivo debe incluir columnas para tipo de documento, número, nombres, apellidos, correo,
            teléfono y número de ficha.
          </Alert>
        </CardContent>
      </Card>

      <QueryState
        isLoading={batchesQuery.isLoading}
        isError={batchesQuery.isError}
        error={batchesQuery.error}
        data={batchesQuery.data}
        isEmpty={(d) => d.length === 0}
        emptyIcon={Upload}
        emptyTitle="Sin importaciones previas"
        emptyDescription="Las importaciones realizadas aparecerán en este historial."
        loadingLabel="Cargando historial..."
      >
        {(batches) => (
          <Card>
            <CardHeader>
              <CardTitle>Historial de importaciones</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Archivo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Exitosos</TableHead>
                    <TableHead>Errores</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((batch) => (
                    <TableRow key={batch.id}>
                      <TableCell>{batch.fileName}</TableCell>
                      <TableCell>{formatDate(batch.createdAt, "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            batch.status === "COMPLETED"
                              ? "success"
                              : batch.status === "FAILED"
                                ? "destructive"
                                : "warning"
                          }
                        >
                          {batchStatusLabels[batch.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{batch.totalRows}</TableCell>
                      <TableCell>{batch.successRows}</TableCell>
                      <TableCell>{batch.errorRows}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </QueryState>
    </div>
  );
}
