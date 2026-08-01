# DESIGN.md

## Direction
SaaS moderno institucional (Linear / Notion / Stripe Dashboard) con identidad visual oficial del SENA. Densidad útil para jornadas largas, jerarquía clara. Sidebar en "chrome" oscuro azul institucional + contenido en superficie clara — patrón reconocible de producto moderno.

## Color institucional (Manual de Identidad Visual SENA 2024)
Paleta oficial tomada del manual de marca:

- Verde institucional (logosímbolo): `#39A900`
- Verde oscuro (secundario): `#007832`
- Azul oscuro (secundario): `#00304D`
- Violeta (secundario): `#71277A`
- Amarillo (secundario): `#FDC300`
- Azul claro / cian (secundario): `#50E5F9`
- Neutros: blanco `#FFFFFF`, negro `#000000`, gris claro `#F6F6F6`

## Mapeo a tokens de producto
El verde puro (`#39A900`) tiene contraste insuficiente para texto blanco en botones (≈3:1), así que se reserva como **acento de marca** (`--brand`): logo, rail activo, focos decorativos. Para elementos interactivos con texto se usa el verde oscuro oficial (`#007832`, contraste ≈5.6:1 con blanco) como `--primary`.

- `--brand` `#39A900` — logo, indicadores activos, highlights puntuales
- `--primary` `#007832` — botones, enlaces, foco, acciones principales
- `--secondary` tint verde claro — fondos de badges/chips de éxito
- `--info` `#00304D` (azul oscuro oficial) — información, texto sobre tint claro
- `--stat` `#71277A` (violeta oficial) — métricas, analítica, distribución
- `--warning` derivado de amarillo oficial, oscurecido a `#7A5B00` para accesibilidad de texto
- `--destructive` rojo institucional de producto (no forma parte del manual SENA, uso funcional)
- `--sidebar` `#00304D` (azul oscuro oficial) — chrome de navegación oscuro

## Typography
Una sola familia: **Plus Jakarta Sans**.
Escala: 12 / 14 / 16 / 20 / 24 / 30.
Pesos: 400, 500, 600, 700.

## Layout
- Sidebar oscura (azul SENA) ~248px; grupos colapsables; rail activo en verde institucional puro
- Contenido en superficie clara con padding generoso (24–32px); max-width ~72rem
- Espaciado: 4 / 8 / 12 / 16 / 24 / 32 / 48
- KPI como StatCards con icono y tinte semántico
- Tablas con toolbar unificada (búsqueda + filtros + CTA)
- Matrices (seguimiento / horarios) con sticky headers y scroll sincronizado

## Components
- Radius base: 8px (`0.5rem`); sombras muy ligeras + borde sutil
- Botones: altura 40 / 32; primario en verde oscuro SENA, texto blanco
- Inputs: borde sutil, focus ring primary
- Badges: flat semánticos (success, warning, destructive, info, stat) sobre tints claros
- Dialogs para formularios y edición; dropdowns para acciones de fila
- Empty / loading (skeleton) / error obligatorios
- Command palette `Ctrl/Cmd+K` para navegación rápida

## Motion
150–200ms ease-out solo para estado (hover, focus, open/close). Sin coreografía de page-load.
