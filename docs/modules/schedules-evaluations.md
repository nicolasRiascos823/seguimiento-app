# Trimestres, Horarios y Evaluaciones

## Funcional

Organiza la programación académica por trimestre, ambientes y bloques horarios (06:00–22:00, lun–sáb). El seguimiento es una matriz aprendiz × instructor con estados de rendimiento parametrizables. Los llamados usan primer/segundo llamado y flujo de comité.

## Técnico

Módulos Nest: `trimesters`, `environments`, `schedules`, `performance-statuses`, `evaluations`, `warnings`, `reports` (PDFKit carta), `dashboard`.

## Reglas

- Máx. 10 h/día por instructor
- Sin traslapes instructor / ficha / ambiente
- No borrar horarios si hay evaluaciones del trimestre (solo inactivar)

## Riesgos

`synchronize` en desarrollo altera enums PG; en producción preferir migraciones formales.

## Mejoras

Migraciones TypeORM versionadas; cola de generación de PDF para reportes masivos.
