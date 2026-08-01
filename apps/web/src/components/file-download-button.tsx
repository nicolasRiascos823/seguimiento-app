"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/utils";
import { toast } from "sonner";

interface FileDownloadButtonProps {
  fileId: string;
  fileName: string;
}

export function FileDownloadButton({ fileId, fileName }: FileDownloadButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const response = await api.get(`/files/${fileId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(response.data);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "No se pudo descargar el archivo"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="link" size="sm" className="h-auto p-0" loading={loading} onClick={handleDownload}>
      <Download className="h-3 w-3" />
      {fileName}
    </Button>
  );
}
