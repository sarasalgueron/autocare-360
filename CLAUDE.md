# AutoCare360 — Frontend (React + TypeScript + Vite)

Proyecto académico de **Programación Aplicada 2026-2** (código PA-02). Este repo es solo el **frontend web**;
el backend Spring Boot + PostgreSQL vive en otro proyecto. Responder siempre en **español**.

## Fuentes de referencia (en `docs/guias/`)

- `AutoCare.pdf` — **enunciado oficial** del proyecto: actores, reglas de negocio RN-01..RN-08,
  entidades, RF-01..RF-20, API REST mínima y entregas (Parcial 1, TPs, Parcial 2, Final).
- 10 guías del docente, escritas para el proyecto de ejemplo **ParkFlow360**. El estudiante aplica cada
  guía a **AutoCare360**. Original en `.docx`/`.pdf`; versión en texto plano en `docs/guias/texto/guia_XX.txt`
  (la Guía 01 es PDF, leerla directamente).

| Guía | Tema | Entregables clave |
|------|------|-------------------|
| 01 | Estructura Vite + React + TS | Carpetas feature-based, `App.tsx` en `src/app/`, `.env.example` |
| 02 | React Router | `BrowserRouter` en main, `AppRouter`, `MainLayout` con `Outlet`, `Sidebar` con `NavLink`, 404, ruta `/acerca` |
| 03 | Modelos TS + mocks + tablas | `models/Cliente.ts`, `models/Vehiculo.ts` (`clienteId`), `data/*.mock.ts`, `ClienteTable`, `VehiculoTable` |
| 04 | Formularios controlados | `types/*FormData.ts` (anio/clienteId como string), `utils/*Validation.ts`, `ClienteForm`, `VehiculoForm` |
| 05 | Conexión HTTP | `.env.development` (`VITE_API_URL`), `src/api/apiClient.ts` (`apiFetch`, `ApiError`), `services/*Service.ts`, GET+POST reales, loading/error/submitting |
| 06 | CRUD Cliente | service con listar/obtenerPorId/crear/actualizar/eliminar; tabla con `onEdit`/`onDelete`; form único crear/editar; sincronizar con map/filter |
| 07 | CRUD Vehículo + 1:N | `Promise.all` vehículos+clientes, select de propietario, cambio de propietario por PUT, `Map` clientePorId, filtro por cliente |
| 08 | Estado y hooks | `isAbortError`, `shared/hooks/useAsyncList`, `useClientes`/`useVehiculos`, estado derivado (no duplicar en useState), loading/saving/deletingId |
| 09 | UI reutilizable | `components/ui/` (Button, SearchInput, SelectFilter, Pagination, Modal con `<dialog>`, ConfirmDialog, EmptyState, StatusBadge), búsqueda+filtros+paginación, `tokens.css` |
| 10 | Cierre | Dashboard con `MetricCard`, `AppErrorBoundary`, Vitest + jsdom + Testing Library, `.env.production`, build/preview, fallback SPA |

## Convenciones (de las guías — respetarlas)

- Estructura por feature: `src/features/<dominio>/{components,pages,services,models,types,utils,data,hooks}`.
- Componentes y páginas en PascalCase (`ClientesPage.tsx`); hooks `useX.ts`; services `xService.ts`; carpetas de feature en minúsculas.
- Las pages coordinan; las tablas y formularios reciben datos/callbacks por props y **no** importan services.
  Los componentes de `components/ui` no conocen el dominio.
- Solo los services conocen rutas HTTP; todo pasa por `apiFetch`. Nada de `fetch` directo en componentes.
- Sin `any`. Usar `import type` para tipos.
- La UI cambia solo después de una respuesta exitosa del backend (usar el objeto que devuelve la API).
- El contrato real está en el **Swagger del backend**; las rutas `/api/clientes`, `/api/vehiculos` son de ejemplo.
- El router es `react-router` (no `react-router-dom`). Lint con `oxlint`.

## Adaptación ParkFlow360 → AutoCare360

- La UI ya dice **AutoCare360**.
- Los modelos NO son los de las guías: siguen el DDL real (`autocare` schema) y el backend.
  - `Cliente`: `id, documento, nombreCompleto, email|null, telefono|null, activo` (sin nombre/apellido).
  - `Vehiculo`: `id, clienteId, placa, vin, marca, modelo, color|null, activo` (sin `anio`; `vin` UNIQUE por RF-15).
  - Campos opcionales vacíos se envían como `null`.
- RN-01: el propietario de un vehículo debe estar activo (validado en el front y en el backend).
- Módulos que vienen después según el enunciado (sin guía de frontend todavía): ServicioCatalogo, OrdenServicio
  (estados ABIERTA → DIAGNOSTICO → ESPERA_APROBACION → EN_TRABAJO → LISTA_ENTREGA → ENTREGADA / CANCELADA),
  TareaOrden, Estimacion/ItemEstimacion, Evidencia, HistorialEstadoOrden, Notificacion y Reportes.
  Para estos se reutiliza el mismo patrón de las guías 06–09.

## Cómo ayudar

- El estudiante debe **defender oralmente** el código: explicar el porqué y no solo pegar soluciones.
  Las prácticas de cada guía son evaluadas y no tienen solucionario, así que hay que guiar sin hacerlas enteras salvo que lo pida.
- Seguir el orden de las guías: no adelantar librerías ni patrones de guías posteriores (por ejemplo, Axios o paginación en la Guía 05).
- Verificar con `npm run test:run` y `npm run build`.

## Estado actual (2026-10-08)

`npm run build` pasa sin errores.
- **Clientes**: Guía 06 completa (CRUD con GET/{id}, form crear/editar, DELETE con `window.confirm`).
- **Vehículos**: Guía 07 completa (CRUD, `Promise.all`, selector de propietario, cambio de propietario por PUT,
  `Map` clientePorId, filtro local por cliente). `VehiculoRequest` vive en `types/VehiculoFormData.ts`.
- **Guía 08** completa: `src/shared/utils/isAbortError.ts`, `src/shared/hooks/useAsyncList.ts` (data/loading/error/reload
  con AbortController), `useClientes`/`useVehiculos` en `features/*/hooks`. Las pages separan `loadError` (del hook,
  con botón Reintentar → `reload`) de `actionError` (POST/PUT/DELETE), y muestran `successMessage` temporal.
- **Guía 09** completa: `src/components/ui/` (Button, SearchInput, SelectFilter, Pagination, Modal con `<dialog>`,
  ConfirmDialog, EmptyState, StatusBadge), `styles/tokens.css` + `styles/ui.css`. Funciones puras:
  `shared/utils/paginate.ts` (ajusta la página fuera de rango), `shared/utils/filters.ts`,
  `features/*/utils/*Filters.ts`. Las pages filtran → paginan en cada render; el reset a página 1 se hace en los
  handlers de onChange (no con useEffect, a diferencia del código de la guía). DELETE pasa por `pendingDelete` + ConfirmDialog.
- **Guía 10** completa: Dashboard con `MetricCard` (5 métricas derivadas), `app/AppErrorBoundary.tsx` envolviendo
  la app en `main.tsx`, Vitest 5 + jsdom + Testing Library (`vitest.config.ts`, `src/test/setup.ts`, scripts
  `test`/`test:run`; 7 archivos `*.test.ts(x)`, 18 tests), `.env.production` (URL de EJEMPLO), `.env.example`,
  `src/config/env.ts`. Matriz F01–F12 por completar en `docs/pruebas-fullstack.md`.
- Serie de guías del frontend terminada.
- **Servicios (catálogo, RF-07)** completo: `features/servicios` (ruta `/servicios`, menú "Servicios"), mismo patrón
  que Clientes (hook, form, tabla, búsqueda, filtro, paginación, ConfirmDialog). Precio: string en el form →
  `Number()` tras validar con regex de NUMERIC(12,2); se muestra con `shared/utils/format.ts`.
- **Sesión demo (sin login)**: `shared/session/sesionDemo.ts` guarda el id del usuario demo (localStorage,
  por defecto 2 = asesor.demo) y `apiClient` lo envía en `X-Usuario-Id`. `app/SesionDemoProvider.tsx` +
  `app/sesionDemoContext.ts` (`useSesionDemo`) exponen usuarios y usuario actual; el Header tiene el selector.
  Al implementar login se reemplaza esto por el token.
- **Órdenes** (`features/ordenes`, ruta `/ordenes`, primer ítem del menú): formulario de recepción (deshabilita
  vehículos con orden activa, RN-03), tablero de contadores por estado que filtra la tabla, búsqueda por
  número/placa/propietario, paginación y modal de detalle (`OrdenDetalle`, montado con `key={orden.id}`) con
  botones de las `transicionesPermitidas` que envía el backend, formulario de entrega (RN-07) y motivo de
  cancelación, e historial (RF-20) recargado por Effect con AbortController + ignore al cambiar `orden.estado`.
  Fechas con `formatFechaHora` (`shared/utils/format.ts`).
- Siguiente: TareaOrden (asignar técnico, RN-06) o Estimaciones (RN-04/05).
- Verificación completa: `npm run test:run`, `npm run build`, `npm run lint`.
- Backend: `C:\Users\sara_\IdeaProjects\autocare-360` (ver su CLAUDE.md), puerto **9090**, CORS para :5173.
  Contrato verificado: `/api/clientes`, `/api/vehiculos` con `clienteId` numérico. Errores con forma `ApiError`
  (`message`, `fieldErrors`); `apiClient` muestra `message`.
- DELETE físico (decisión del usuario). Borrar un cliente con vehículos → 409 por la FK; la UI conserva la fila.
- Oxlint avisa `set-state-in-effect` en ClienteForm/VehiculoForm: es el patrón de las guías 06/07; alternativa
  defendible: pasar `key={editing?.id ?? 'nuevo'}` al form e inicializar el estado sin Effect.
- Nota de config: `tsconfig` tiene `erasableSyntaxOnly`, así que no se pueden usar parameter properties
  (`constructor(public x)`) aunque las guías las muestren; declarar el campo explícitamente.
