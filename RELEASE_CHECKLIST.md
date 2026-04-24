# Release Checklist - Web App

Fecha de creación: 24 de abril de 2026
Última validación: 24 de abril de 2026

## Pre-release

- [ ] Confirmar rama/PR objetivo y alcance del release.
- [ ] Verificar variables de entorno requeridas (`.env` / despliegue).
- [ ] Revisar cambios de dependencias en `package.json` y lockfile.

## Validación técnica

- [x] `npm run lint -- --quiet` → exit 0, sin errores ni warnings (24/04/2026)
- [x] `npm run typecheck` → exit 0, 0 errores de tipos (24/04/2026)
- [x] `npm run test -- --run` → 18 archivos PASS, 199 tests PASS (24/04/2026)
- [x] `npm run build` → exit 0, bundle ~1.63 MB (JS: 1.59 MB, CSS: 33 KB) (24/04/2026)

## Validación funcional rápida

- [ ] Login/logout.
- [ ] Navegación entre módulos principales.
- [ ] Creación/edición básica en al menos un flujo crítico.
- [ ] Verificar toasts y manejo de errores visibles.

## Documentación y cierre

- [x] Actualizar `web/Progress_Sumary.md` con resultados del release.
- [x] Actualizar `web/TODO.md` con tareas completadas y pendientes.
- [ ] Registrar riesgos conocidos (si aplica).

## Riesgos conocidos

- Bundle JS (~1.59 MB sin gzip) es grande; candidato para code-splitting por ruta cuando el proyecto crezca.
- Validación funcional manual pendiente antes de despliegue a producción.
