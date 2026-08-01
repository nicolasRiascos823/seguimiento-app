# Timeline, Search & Dashboard

## Funcional

Línea de tiempo del aprendiz (seguimientos, llamados, cambios de estado). Búsqueda paginada por documento/nombre/ficha/líder/estado. Dashboard con totales, seguimientos por instructor, aprendices con más llamados y actividad reciente.

## Técnico

Agregaciones TypeORM QueryBuilder (`GROUP BY`) + `audit_logs`. Instructores ven métricas filtradas a sus fichas.

## Decisiones

Timeline unificado en API para que el frontend no ensamble eventos.

## Riesgos

Búsquedas `ILIKE` pueden degradar con mucho volumen. Evaluar `pg_trgm`.

## Mejoras

Índices GIN trigram y caché de dashboard.
