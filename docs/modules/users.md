# Users

## Funcional

CRUD de usuarios del sistema (admin). Roles `ADMIN` e `INSTRUCTOR`. Desactivación sin borrado físico.

## Técnico

Endpoints bajo `/users` protegidos con `@Roles(ADMIN)`. Contraseñas hasheadas; respuestas sin `passwordHash`.

## Decisiones

Soft status `INACTIVE` en lugar de delete para preservar historial de seguimientos/llamados.

## Riesgos

Un admin puede degradar o desactivar a otro admin. Operación sensible; auditar siempre.

## Mejoras

Invitación por correo y reset de contraseña.
