# Groups (Fichas)

## Funcional

Crear/editar fichas con número e instructor líder. Estados Activa/Inactiva. Nunca se eliminan.

## Técnico

`GroupsService` valida que el líder exista, esté activo y sea `INSTRUCTOR`. Instructores solo ven fichas donde `leaderId = userId`.

## Decisiones

Un líder por ficha (simplifica RBAC). Extensión multi-instructor documentada como mejora.

## Riesgos

Si el líder cambia, el instructor anterior pierde acceso inmediato a la ficha.

## Mejoras

Tabla `group_instructors` para múltiples instructores por ficha.
