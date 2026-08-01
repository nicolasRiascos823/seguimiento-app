# Apprentices & Imports

## Funcional

Gestión de aprendices y carga masiva desde Excel (tipo doc, documento, nombres, apellidos, correo, teléfono, ficha). Upsert por documento, errores por fila, resumen y auditoría.

## Técnico

Parser con `xlsx`, normalización de encabezados, límite 2000 filas, `ImportBatch` + `ImportRowError`.

## Decisiones

Procesamiento síncrono para simplicidad operativa del MVP productivo.

## Riesgos

Archivos muy grandes pueden bloquear el event loop. Mitigado con límite de filas.

## Mejoras

Cola async (BullMQ) + plantilla Excel descargable.
