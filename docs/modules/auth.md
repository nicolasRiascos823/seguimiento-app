# Auth

## Funcional

Login con email/password, emisión de access JWT + refresh token rotativo en cookie httpOnly, logout y consulta de sesión (`/auth/me`).

## Técnico

- Hash Argon2
- Passport JWT + guards globales
- Refresh token hasheado (SHA-256) en BD con revocación

## Decisiones

Access corto (15m) + refresh 7d para reducir ventana de compromiso sin degradar UX.

## Riesgos

Robo de access token en localStorage del frontend. Mitigado con TTL corto y refresh rotativo.

## Mejoras

Soporte SSO institucional SENA / MFA.
