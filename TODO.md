# TODO - Web App (Gestio v2)

Fecha de actualización: 24 de abril de 2026

## Completado reciente

- [x] Configurar ESLint v9 (flat config).
- [x] Resolver errores bloqueantes de lint.
- [x] Corregir seguridad de cambio de contraseña en perfil (reauth obligatoria).
- [x] Alinear tipos React para compatibilidad de typecheck en tests.
- [x] Resolver dependencia faltante de testing (`@testing-library/dom`).
- [x] Validar módulos web con pruebas UI mock (14 suites, 28 tests en PASS).
- [x] Confirmar calidad base: lint y typecheck en verde.
- [x] Limpiar archivos temporales/no funcionales en la raíz de `web/`.
- [x] Ejecutar corrida completa de `npm run test` y registrar evidencia.
	- Resultado: exit code 0, 16 archivos de test en PASS, 193 tests en PASS, 0 fallos, 0 skipped, ~24s.
- [x] Estandarizar manejo de errores de red en módulos CRUD clave con helper compartido.
	- Archivo agregado: `src/lib/errorToast.ts`
	- Páginas aplicadas: customers, products, stores, suppliers, movements, exchange rates.
- [x] Aumentar cobertura en flujos críticos create/edit/delete.
	- `CustomersPage.ui.test.tsx` cubre apertura de formulario en crear/editar y confirmación de eliminar.
- [x] Añadir validación de rutas protegidas y gating por sesión.
	- Tests nuevos: `src/router/ProtectedRoute.test.tsx` y `src/App.auth-routing.test.tsx`.
- [x] Ejecutar validación final de calidad web tras cambios.
	- `npm run lint -- --quiet` -> OK
	- `npm run typecheck` -> OK
	- `npm run test -- --run` -> 18 archivos PASS, 199 tests PASS.
- [x] Eliminar warning UX de `DialogContent` sin descripción en categorías.
	- Archivo ajustado: `src/pages/inventory/CategoriesPage.tsx` (se añadió `DialogDescription`).
	- Validación: `npm run test -- --run src/pages/inventory/CategoriesPage.ui.test.tsx` -> 4 tests PASS, sin warning de accesibilidad.
- [x] Completar adopción de helper de errores en inventario/categorías.
	- `CategoriesPage.tsx` ahora usa `showErrorToast` en create/update/delete.

## Pendiente inmediato (prioridad alta)

- [x] Sin pendientes críticos inmediatos.

## Pendiente de calidad (prioridad media)

- [x] Reducir warnings de lint por lotes (sin romper funcionalidad).
- [x] Estandarizar manejo de errores de red en páginas de módulos con feedback UX consistente.
- [x] Revisar cobertura de pruebas para flujos de formularios críticos (create/edit/delete).

## Pendiente funcional (prioridad media)

- [x] Añadir smoke test de navegación autenticada base (gating de AppRouter/AuthRouter).
- [x] Verificar comportamiento de rutas protegidas con sesión expirada.
- [x] Auditar consistencia de mensajes de error y éxito en toasts.

## Mantenimiento

- [x] Definir checklist corto de release web (lint, typecheck, test, build).
	- Archivo: `web/RELEASE_CHECKLIST.md`
- [x] Mantener este archivo actualizado por sesión cuando se cierre trabajo en web.
