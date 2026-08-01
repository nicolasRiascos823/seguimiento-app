# Frontend

## Funcional

Interfaz SaaS para login, dashboard, usuarios, fichas, aprendices (detalle + timeline), importación Excel, catálogos, seguimientos y llamados.

## Técnico

Next.js 15 App Router, TanStack Query, Axios (JWT + refresh cookie), RHF + Zod, tipografía IBM Plex Sans + Source Serif 4, acento institucional teal.

## Decisiones

Token access en memoria/`localStorage` y refresh httpOnly para balance UX/seguridad. Componentes UI ligeros al estilo shadcn sin acoplar CLI.

## Riesgos

XSS podría exponer access token. Mitigado con TTL corto y sanitización API.

## Mejoras

Middleware con cookie de sesión y SSR de datos críticos.
