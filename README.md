# Sistema de Seguimiento de Aprendices SENA

Monorepo con API NestJS (`apps/api`) y frontend Next.js (`apps/web`).

## Requisitos

- Node.js 22+
- PostgreSQL 16+
- Docker (opcional)

## Configuración rápida

1. Copia variables de entorno:

```bash
cp .env.example .env
cp .env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
```

2. Define usuario y contraseña de PostgreSQL en `.env` / `apps/api/.env`:

```env
DATABASE_URL=postgresql://USUARIO:CONTRASEÑA@localhost:5432/seguimiento
```

3. Crea la base de datos en PostgreSQL (una vez):

```sql
CREATE DATABASE seguimiento;
```

4. Instala dependencias y siembra datos (TypeORM crea tablas en desarrollo con `synchronize`):

```bash
npm install
npm run seed
```

5. Arranca:

```bash
npm run dev:api
npm run dev:web
```

- API: http://localhost:3001/api/v1
- Swagger: http://localhost:3001/api/docs
- Web: http://localhost:3000

## Credenciales seed

| Rol | Email | Password |
|-----|-------|----------|
| Admin | admin@sena.edu.co | Admin123! |
| Instructor | instructor@sena.edu.co | Instructor123! |

## Docker Compose

```bash
docker compose up --build
```

## Estructura

```
apps/api     NestJS + TypeORM + JWT/RBAC
apps/web     Next.js App Router + TanStack Query
docs/modules Documentación por módulo
```

## Principios

- Soft delete / historial append-only
- RBAC: Admin global; Instructor solo fichas donde es líder
- Catálogos de Competencia / RA
- Importación Excel de aprendices con auditoría
