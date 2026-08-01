# Follow-ups & Warnings & Files

## Funcional

Seguimientos append-only (fecha, competencia, RA, observaciones, compromisos, estado). Llamados académicos/disciplinarios con adjunto opcional. Archivos en disco local (`UPLOAD_DIR` / volume Docker).

## Técnico

Validación mime/size (PDF/JPG/PNG/DOC/DOCX, 5MB). Descarga autenticada por id. Nunca se sobrescriben registros históricos.

## Decisiones

Adjuntos locales (2A) para despliegue simple; metadatos en `FileObject`.

## Riesgos

En multi-instancia sin volumen compartido los archivos no están disponibles. Usar volume o migrar a object storage.

## Mejoras

MinIO/S3 y virus scan en uploads.
