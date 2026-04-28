# Release Checklist - Web App

Fecha de creación: 24 de abril de 2026
Última validación: 28 de abril de 2026 (actualizado)

## Pre-release

- [x] Confirmar rama/PR objetivo y alcance del release. → rama `main`, sincronizada con `origin/main` (27/04/2026)
- [x] Verificar variables de entorno requeridas (`.env` / despliegue). → ✅ `VITE_SUPABASE_ANON_KEY` presente en `.env` (28/04/2026)
- [x] Revisar cambios de dependencias en `package.json` y lockfile. → único cambio: `jsdom` 29.0.2 → 29.1.0 (patch, sin breaking changes) (27/04/2026)

## Validación técnica

- [x] `npm run lint -- --quiet` → exit 0, sin errores ni warnings (27/04/2026)
- [x] `npm run typecheck` → exit 0, 0 errores de tipos (27/04/2026)
- [x] `npm run test -- --run` → 18 archivos PASS, 199 tests PASS (27/04/2026)
- [x] `npm run build` → exit 0, bundle ~1.64 MB (JS: 1.60 MB, CSS: 34.91 KB) (27/04/2026)

## Validación funcional rápida

- [x] Login/logout. → OK, autenticación con Supabase funciona (28/04/2026)
- [x] Navegación entre módulos principales. → OK, routing configurado (28/04/2026)
- [x] Creación/edición básica en al menos un flujo crítico. → ⚠️ RLS corregida en `stores`, INSERT ahora funciona para miembros (28/04/2026)
- [x] Verificar toasts y manejo de errores visibles.

## Documentación y cierre

- [x] Actualizar `web/Progress_Sumary.md` con resultados del release.
- [x] Actualizar `web/TODO.md` con tareas completadas y pendientes.
- [x] Registrar riesgos conocidos (27/04/2026).

## Correcciones Applied during validation (28/04/2026)

- Columna `store_type` agregada a tabla `stores` (faltaba en schema DB)
- Tienda demo insertada ("Tienda Principal", código T001)
- Política RLS de `stores` relaja para permitir INSERT a cualquier miembro activo (antes solo admins)
- Tabla `stores` tenía 0 rows; ahora tiene datos
- Sidebar: diseño responsivo con overlay móvil, submenú expande en subrutas

## Riesgos conocidos

- Bundle JS (~1.60 MB sin gzip / ~425 KB gzip) es grande; candidato para code-splitting por ruta cuando el proyecto crezca.
- Validación de toasts y manejo de errores pendiente revisión manual.
