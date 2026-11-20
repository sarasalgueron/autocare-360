# Bloque E — Testing, build, producción y defensa integral (preguntas 43–50)

[← Volver al índice](README.md)

> Antes del examen ejecuta `npm run test:run` y `npm run build` una vez, para poder mostrar la salida.
> Resultado verificado el 2026-10-09: **10 archivos de test, 30 tests, todos pasan**; el build genera `dist/`.

---

## PREGUNTA 43 — CRÍTICA
### Diseña la estrategia de testing de AutoCare360 por niveles.

**Idea simple**

No se prueba todo de la misma forma. Es como revisar un auto: pruebas cada pieza por separado (frenos,
luces), después pruebas que funcionen juntas (frenar al pisar el pedal) y al final das una vuelta real en
la calle. Cada nivel detecta **tipos distintos de fallas**.

**Los niveles, con lo que ya tienes y lo que faltaría**

| Nivel | Qué prueba | Riesgo que detecta | En tu proyecto |
|---|---|---|---|
| **1. Funciones puras (unitarias)** | Lógica sin React ni red: entra un dato, sale un resultado | Errores de cálculo y de reglas: paginar mal, filtro que no encuentra, validación que deja pasar un email inválido | ✅ `paginate.test.ts`, `clienteFilters.test.ts`, `clienteValidation.test.ts`, `servicioValidation.test.ts`, `ordenFilters.test.ts`, `ordenValidation.test.ts` |
| **2. Componentes (presentación)** | Que el componente muestra lo correcto según sus props | Texto o estado visual equivocado | ✅ `StatusBadge.test.tsx`, `AppErrorBoundary.test.tsx` |
| **3. Interacción** | Simular al usuario (clic, escribir) y ver la reacción | Botón que no llama al callback, botón que debería estar deshabilitado | ✅ `Pagination.test.tsx`, `SearchInput.test.tsx` |
| **4. Hooks / services con API simulada** | El hook o la página con un `fetch` falso | Que el loading se apague, que un 409 muestre el mensaje y no quite la fila | ⏳ No implementado (siguiente paso) |
| **5. Integración real con backend** | Frontend + backend + base reales | Contrato roto, CORS, URL mal configurada | 📋 Manual: matriz F01–F12 en `docs/pruebas-fullstack.md` |

**No todo se mockea ni todo necesita backend real**:
- Las funciones puras no necesitan nada: son las pruebas más baratas y rápidas, por eso tengo más.
- Mockear la API es útil para probar **cómo reacciona la UI** a cada respuesta (incluidos errores difíciles
  de provocar, como un 500).
- Pero solo con el backend real compruebo que **el contrato coincide** (P45).

**Un test de nivel 4 que agregaría**: renderizar `ClientesPage` con `fetch` simulado que devuelve dos
clientes, hacer clic en Eliminar → confirmar, simular un **409** y comprobar que aparece el mensaje y que
la fila **sigue** en la tabla.

**Repregunta de presión**: *Dame un bug de UI que detectaría RTL y un bug de contrato HTTP que un test
presentacional no detectaría.*

- **Bug de UI (lo detecta RTL)**: el botón "Siguiente" de `Pagination` queda habilitado en la última página
  (si alguien cambia `page >= totalPages` por `page > totalPages`). El test `Pagination.test.tsx:17-23`
  hace `expect(...).toBeDisabled()` y fallaría. Otro: que `StatusBadge` muestre "Activo" para un cliente
  inactivo.
- **Bug de contrato (no lo detecta)**: el backend cambia el campo `nombreCompleto` por `nombre`. Mi
  `ClienteTable` sigue leyendo `cliente.nombreCompleto` y la columna se ve vacía. Un test presentacional
  le pasa a la tabla un objeto **escrito por mí** con `nombreCompleto`, así que **pasa en verde**. Solo lo
  detecta una prueba contra el backend real (o un test de contrato contra el Swagger).

---

## PREGUNTA 44
### Explica Vitest, React Testing Library y userEvent desde la perspectiva del usuario.

**Las tres herramientas y qué hace cada una**

| Herramienta | Rol | Lo que usas |
|---|---|---|
| **Vitest** | El **motor**: encuentra los archivos `*.test.ts(x)`, los ejecuta y verifica resultados | `describe`, `it`, `expect`, `vi.fn()`, `vi.spyOn` |
| **jsdom** | Un **navegador falso** en Node (DOM sin pantalla) | `environment: 'jsdom'` en `vitest.config.ts` |
| **React Testing Library (RTL)** | **Monta** componentes en ese DOM y los **busca** como lo haría una persona | `render`, `screen.getByRole`, `getByText`, `getByLabelText` |
| **userEvent** | **Simula al usuario**: clics, escribir, teclado (con todos los eventos que dispara un navegador real) | `userEvent.setup()`, `user.click`, `user.type` |
| **jest-dom** | Agrega comprobaciones legibles | `toBeInTheDocument()`, `toBeDisabled()`, `toHaveTextContent()` |

Configuración: `vitest.config.ts` (jsdom + `setupFiles`) y `src/test/setup.ts` (importa jest-dom y hace
`cleanup()` después de cada test para que no se mezclen).

**Ejemplo explicado: `Pagination.test.tsx:7-15`**
```tsx
const user = userEvent.setup();               // un "usuario" virtual
const onPageChange = vi.fn();                 // función espía: registra cómo la llaman

render(<Pagination page={1} totalPages={3} onPageChange={onPageChange} />);
await user.click(screen.getByRole('button', { name: /siguiente/i }));   // busca el botón como lo ve una persona

expect(onPageChange).toHaveBeenCalledWith(2); // ¿pidió la página 2?
```
Patrón **Arrange → Act → Assert** (preparar → actuar → comprobar).

**Queries por rol, label y texto**: `getByRole('button', { name: /siguiente/i })` busca "un botón cuyo
nombre accesible sea Siguiente", que es como lo encuentra un usuario o un lector de pantalla. Orden de
preferencia: `getByRole` → `getByLabelText` → `getByText` → (último recurso) `getByTestId`. Evito buscar por
clase CSS (`.btn--ghost`), porque si cambio el estilo el test se rompe sin que la funcionalidad haya cambiado.
Bonus: si un test no encuentra un elemento por su rol o label, muchas veces significa que tienes un problema
de **accesibilidad**. `SearchInput.test.tsx:19-22` comprueba justamente que el input tenga etiqueta.

**Repregunta de presión**: *¿Por qué probar que "setState fue llamado" suele ser peor que comprobar lo que
el usuario ve después del clic?*

Porque `setState` es un **detalle de implementación**:
1. **Se rompe sin motivo**: si mañana cambio `useState` por `useReducer` o muevo el estado a un hook, el
   test falla aunque la pantalla funcione igual (falso negativo).
2. **No prueba lo importante**: que se llame a `setState` no garantiza que la pantalla cambie bien. Podría
   llamarse con el valor equivocado, o el render podría tener un error, y el test pasaría (falso positivo).
3. **El usuario no ve `setState`**: ve "Página 2 de 3", un botón deshabilitado o un mensaje.
Un test que comprueba lo visible ("después del clic aparece 'Cliente eliminado correctamente'") sobrevive a
cualquier refactor y falla solo si de verdad algo se rompió para el usuario.

---

## PREGUNTA 45
### ¿Cuándo mockearías la API y cuándo necesitas una integración más realista?

**Idea simple**

**Mockear** es reemplazar el backend por uno de mentira que responde lo que tú le digas. Es como practicar
un examen oral con un amigo que te hace preguntas conocidas: rápido y útil, pero no es el profesor real.

**Comparación**

| | **API mockeada** | **Integración real** (front + back + base) |
|---|---|---|
| Velocidad | Milisegundos | Segundos; hay que levantar backend y PostgreSQL |
| Determinismo | Siempre el mismo resultado | Depende de los datos que haya en la base |
| Casos difíciles | Fácil simular 500, red caída, respuesta lenta | Difícil provocar un 500 a propósito |
| Detecta contratos rotos | ❌ No | ✅ Sí |
| Detecta CORS / URL / `.env` mal | ❌ No | ✅ Sí |
| Detecta reglas reales del backend (RN-01, 409) | Solo si las simulas bien | ✅ Sí |
| Corre en CI sin infraestructura | ✅ Sí | Necesita backend y base |

**Formas de mockear**
- **Stub de `fetch`**: `vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([...]), { status: 200 }))`.
  Simple, pero acopla el test a que uses `fetch`.
- **Mockear el service**: `vi.mock('../services/clienteService')` → la página recibe datos falsos.
- **MSW (Mock Service Worker)**: intercepta las peticiones a nivel de red y responde según la URL
  (`http.get('*/api/clientes', () => HttpResponse.json([...]))`). Es lo más realista sin backend: tu
  `apiFetch` funciona tal cual. No lo uso todavía en el proyecto; sería el siguiente paso para el nivel 4.

**Cuándo uso cada uno**
- **Mock**: para probar cómo **reacciona la UI** (loading, mensaje de error, la fila no se quita con 409),
  en tests automáticos que corren en cada cambio.
- **Integración real**: antes de entregar, para verificar el **flujo completo**. En mi proyecto lo hago a
  mano con la matriz F01–F12 de `docs/pruebas-fullstack.md` (crear, editar, eliminar, 409, cambio de
  propietario...), mirando Network.

**Repregunta de presión**: *Si todos los tests mockean una respuesta perfecta que ya no coincide con el
backend, ¿qué falsa confianza aparece?*

Todos los tests salen **en verde** y la aplicación **está rota** en producción. Ejemplo: el backend empieza
a devolver la lista paginada `{ "content": [...], "totalElements": 50 }` en vez de un array. Mis mocks
siguen devolviendo `[...]`, así que los tests pasan, pero en el navegador real `clientes.filter` falla
porque `clientes` es un objeto. El mock se convirtió en una **mentira congelada**: prueba que mi frontend
funciona contra un backend **que ya no existe**. Por eso los mocks deben copiarse del contrato real
(Swagger) y debe haber al menos una verificación de integración real.

---

## PREGUNTA 46
### Diferencia ErrorBoundary de manejo de errores de fetch.

**Idea simple**

Son dos redes de seguridad para **dos tipos de caídas distintas**:
- **ErrorBoundary**: atrapa errores que ocurren **mientras React dibuja** (un bug en el código de un
  componente). Es la red de emergencia para que no quede la pantalla en blanco.
- **try/catch en fetch**: atrapa errores **esperables** de comunicación (409, 404, servidor caído). Son
  situaciones normales del negocio que la pantalla debe mostrar de forma controlada.

**Tu `AppErrorBoundary`** (`app/AppErrorBoundary.tsx`), envuelve toda la app en `main.tsx:12`:
```tsx
static getDerivedStateFromError(): State {        // línea 15: hubo error al dibujar → hasError = true
    return { hasError: true };
}
componentDidCatch(error, info) {                  // línea 20: registra el error (consola o servicio de logs)
    console.error('Render error', error, info.componentStack);
}
render() {                                        // línea 24: si hubo error, muestra el fallback
    if (this.state.hasError) return <main role="alert">La interfaz tuvo un problema...</main>;
    return this.props.children;
}
```
- Tiene que ser **componente de clase**: React no tiene un hook equivalente (comentario de la línea 9).
- Lo prueba `AppErrorBoundary.test.tsx`: un componente que lanza error al renderizar → aparece el fallback.

**Qué captura y qué NO** (comentario de las líneas 7-8):

| Error | ¿Lo captura el ErrorBoundary? |
|---|---|
| Un componente hace `cliente.nombre.toUpperCase()` y `nombre` es undefined, durante el render | ✅ Sí |
| Error dentro de un `useEffect` síncrono (en la fase de commit) | ✅ Sí |
| `fetch` rechazado / `ApiError` 409 dentro de un `async` | ❌ No (ocurre fuera del render) |
| Error en un manejador de evento (`onClick`) | ❌ No |
| Error en un `setTimeout` | ❌ No |

**Errores HTTP como estado controlado**: en mi proyecto los errores de red/HTTP se convierten en **estado**
(`error`, `loadError`, `actionError`, `apiError`) y se dibujan como parte normal de la pantalla, con
información útil y acciones (Reintentar). La página sigue funcionando.

**No usar el boundary como sistema universal de excepciones**: si todo error terminara en el boundary, un
simple "documento duplicado" **reemplazaría toda la aplicación** por "La interfaz tuvo un problema. Recarga
la página." El usuario perdería lo que estaba escribiendo y no sabría qué corregir.

**Repregunta de presión**: *Si fetch responde 500 y tu service lo convierte en Error controlado, ¿por qué no
deberías depender solo del ErrorBoundary?*

1. **Técnicamente no llegaría**: el error se lanza en código asíncrono (después del `await`), fuera del
   render; el ErrorBoundary **no lo ve**. Sin `catch`, se convertiría en un "Unhandled promise rejection" en
   la consola y la pantalla quedaría en "Cargando..." para siempre (`loading` nunca se apaga).
2. **Aunque llegara, sería mala experiencia**: un 500 al guardar debe mostrar "No se pudo guardar" **en el
   formulario**, manteniendo los datos escritos para reintentar; no destruir toda la pantalla.
3. **Cada error necesita una reacción distinta**: un 409 se muestra en el form, un error de carga muestra
   "Reintentar", un AbortError se ignora. El boundary solo sabe mostrar un único mensaje genérico.

---

## PREGUNTA 47 — CRÍTICA
### Explica `npm run build`, `dist`, `npm run preview` y variables de entorno por modo.

**`npm run build`** → `tsc -b && vite build`
1. **`tsc -b`**: revisa los tipos de todo el proyecto. Si hay un error de TypeScript, se detiene (no genera
   nada).
2. **`vite build`**: modo **production**, carga `.env.production`, empaqueta todo, minifica, elimina código
   no usado y pone hashes en los nombres.

**`dist/` — el resultado** (salida real de tu proyecto):
```
dist/index.html                   0.46 kB
dist/assets/index-D7A8O7s1.css    9.82 kB
dist/assets/index-BHSYwr6v.js   304.18 kB  (92 kB con gzip)
```
Son **archivos estáticos**: HTML, CSS y JS. No hay Node, ni Vite, ni TypeScript, ni React "instalado":
todo está traducido y metido en ese `.js`. Se pueden subir a cualquier servidor de archivos (Nginx, Netlify,
Vercel, un bucket S3...). El hash (`BHSYwr6v`) cambia cuando cambia el contenido, así los navegadores
descargan la versión nueva en vez de usar una vieja de su caché.

**`npm run preview`** → `vite preview`
Levanta un servidor local (por defecto `http://localhost:4173`) que sirve la carpeta `dist/` **tal cual
quedó**. Sirve para comprobar el build antes de desplegar (que cargue, que las rutas funcionen, que llame a
la URL correcta). **No es un servidor de producción**: no está pensado para tráfico real, seguridad ni
rendimiento. Ojo: si `.env.production` apunta a un backend que todavía no existe, en preview las peticiones
fallarán; eso es correcto y te avisa de que la URL de producción importa.

**Variables de entorno por modo**

| Comando | Modo | Archivo que carga | `VITE_API_URL` |
|---|---|---|---|
| `npm run dev` | development | `.env.development` | `http://localhost:9090/api` |
| `npm run build` | production | `.env.production` | `https://api.autocare360.example.com/api` (**ejemplo**) |

Antes de compilar para producción hay que verificar que `.env.production` tenga la URL **real** del backend
desplegado. En mi proyecto todavía es una URL de ejemplo (lo dice el comentario del archivo).

**Repregunta de presión**: *Si cambias `.env.production` después de haber generado `dist` pero no
reconstruyes, ¿qué URL queda embebida?*

La **vieja**. Vite **no lee el `.env` cuando la app corre**: lo lee **al compilar** y pega el valor como texto
dentro de `dist/assets/index-*.js` (P09). Cambiar el `.env` después no toca los archivos ya generados. Para
que tome la URL nueva hay que volver a ejecutar `npm run build`. Lo puedo demostrar buscando la URL dentro
del `.js` de `dist`.

---

## PREGUNTA 48
### BrowserRouter en producción: explica fallback SPA, rutas directas y CORS productivo.

**Idea simple**

En una SPA solo existe **un** archivo HTML real: `index.html`. Las "páginas" `/clientes` o `/vehiculos` no
son archivos: las inventa React Router en el navegador. El problema aparece cuando el usuario **escribe la
URL directamente o presiona F5**: el navegador le pide al servidor el archivo `/vehiculos`, y ese archivo
**no existe**.

**Navegación interna vs. acceso directo**
- **Clic en el menú** (`NavLink`): no hay petición al servidor; React Router cambia la pantalla. Siempre
  funciona.
- **F5 en `/vehiculos`** o abrir el link en otra pestaña: el navegador hace `GET /vehiculos` **al servidor
  web**. Si el servidor busca un archivo con ese nombre y no lo encuentra → **404**.

**Fallback SPA**: configurar el servidor web para que **cualquier ruta que no sea un archivo real devuelva
`index.html`**. Entonces se carga React, `BrowserRouter` lee la URL `/vehiculos` y muestra `VehiculosPage`.
- En desarrollo y en `npm run preview`, **Vite ya lo hace** automáticamente; por eso nunca viste el problema.
- En producción depende del hosting. Ejemplos:
  - **Nginx**: `location / { try_files $uri $uri/ /index.html; }`
  - **Netlify**: archivo `public/_redirects` con `/*  /index.html  200`
  - **Vercel**: `vercel.json` con un `rewrite` de `/(.*)` a `/index.html`
  - **Apache**: `.htaccess` con `FallbackResource /index.html`
  En mi proyecto todavía no hay archivo de configuración de hosting porque no está desplegado.

**Dos 404 distintos (no confundir)**

| | 404 del hosting SPA | 404 de la API |
|---|---|---|
| Quién responde | Servidor web del frontend (Nginx, Netlify) | Spring Boot |
| URL | `https://autocare360.com/vehiculos` | `https://api.autocare360.com/api/vehiculos/999` |
| Causa | Falta el fallback | El recurso no existe |
| Qué ve el usuario | Página de error del servidor (no tu app) | Tu app, con el mensaje del backend |
| Mi `NotFoundPage` | No llega a mostrarse (React ni cargó) | — |

Mi `NotFoundPage` (ruta `*`) aparece cuando React **sí** cargó pero la ruta no existe en `AppRouter`
(ej. `/xyz`).

**CORS productivo**: en producción el frontend tendrá otro origen (ej. `https://autocare360.com`). Hay que
agregarlo a `app.cors.allowed-origins` del backend (hoy solo tiene `http://localhost:5173`). Si no, en
producción todas las peticiones fallarán con error de CORS aunque en mi PC funcionaba. Y no usar `*` (todos
los orígenes) en producción: se permite solo el dominio real.

**Repregunta de presión**: *Si `/` funciona pero al refrescar `/vehiculos` el servidor devuelve 404, ¿qué
configuración falta?*

Falta el **fallback SPA** (rewrite a `index.html`) en el servidor web que sirve `dist/`. `/` funciona porque
`index.html` existe físicamente; `/vehiculos` no es un archivo. No es un problema de React ni del backend:
la petición ni siquiera llegó a mi código. Lo confirmo en Network: la petición del **documento** `vehiculos`
(tipo "document", no "fetch") tiene status 404 y la respuesta es la página de error del hosting.

---

## PREGUNTA 49
### Explica el Dashboard y por qué sus métricas son estado derivado, no una segunda fuente de verdad.

**Idea simple**

El Dashboard **no guarda contadores**. Cada vez que se dibuja, **cuenta** a partir de las listas que trajo
del backend. Es como contar las personas de una sala mirando quién está, en vez de llevar una libreta que
alguien tiene que acordarse de actualizar cada vez que alguien entra o sale.

**Tu código** (`pages/DashboardPage.tsx`)

```tsx
const clientes = useClientes();       // línea 11: mismos hooks que las páginas (GET /clientes)
const vehiculos = useVehiculos();     // línea 12: (GET /vehiculos), en paralelo

const loading = clientes.loading || vehiculos.loading;   // línea 14
const error = clientes.error || vehiculos.error;         // línea 16 (|| porque "sin error" es '')

const clientesConVehiculo = new Set(vehiculos.data.map((v) => v.clienteId));   // línea 21

const metrics = {                                        // líneas 23-29: TODO calculado
    clientesTotal: clientes.data.length,
    clientesActivos: clientes.data.filter((c) => c.activo).length,
    vehiculosTotal: vehiculos.data.length,
    vehiculosActivos: vehiculos.data.filter((v) => v.activo).length,
    clientesSinVehiculo: clientes.data.filter((c) => !clientesConVehiculo.has(c.id)).length,
};
```

- **5 métricas**, ninguna en `useState`. Se muestran con `MetricCard` (`components/ui/MetricCard.tsx`).
- "Clientes sin vehículos" usa la relación 1:N: un `Set` con los `clienteId` que aparecen en algún vehículo;
  los clientes que no están ahí tienen 0 hijos. `Set.has` es búsqueda directa (como el `Map` de P36).
- Maneja loading y error igual que las demás páginas.

**¿Por qué no contadores manuales?** Si tuviera `const [totalClientes, setTotalClientes] = useState(0)` y lo
incrementara al crear, tendría que acordarme de actualizarlo en **cada** operación (crear, eliminar,
activar, desactivar, cambiar de dueño…) y en **cada** pantalla. Basta un olvido para que el número quede mal
para siempre. Derivado, es **imposible** que no coincida con las listas.

**Rendimiento y frescura** (comentario de las líneas 5-9):
- Hoy descargo las listas completas para contarlas: está bien con pocos datos.
- Con miles de registros convendría un **endpoint agregado** en el backend (ej. `GET /api/reportes/resumen`
  → `{ clientesTotal: 1520, ... }`), donde la base cuenta con `COUNT(*)`, mucho más eficiente. El enunciado
  ya prevé un módulo de Reportes.
- Frescura: las métricas son las del momento en que se montó el Dashboard. Si otro usuario crea un cliente,
  se ve al volver a entrar (cada montaje hace un GET nuevo).

**Repregunta de presión**: *Si eliminas un Vehículo y el contador no cambia, ¿qué dependencia o fuente de
datos revisarías?*

1. **¿El DELETE fue exitoso?** En Network: `204`. Si fue 409/500, el vehículo sigue existiendo y el contador
   está bien.
2. **¿El Dashboard volvió a cargar?** El Dashboard tiene **su propia instancia** de `useVehiculos` (P41). Si
   elimino en `VehiculosPage`, el `data` del Dashboard no se entera; se actualiza cuando vuelvo a "Inicio"
   (se monta y hace un GET nuevo). Si el Dashboard estuviera montado al mismo tiempo, haría falta `reload()`
   o estado compartido.
3. **¿El cálculo usa la fuente correcta?** Que la métrica se calcule a partir de `vehiculos.data` (la fuente)
   y no de una copia guardada en un `useState` aparte.
4. **¿El backend devuelve el dato actualizado?** En Network, la respuesta del `GET /vehiculos` del Dashboard
   no debe incluir el vehículo borrado (descartar caché).

---

## PREGUNTA 50 — CRÍTICA
### Defiende el flujo Fullstack completo sin saltos: desde una acción del usuario hasta PostgreSQL y de regreso a la UI.

> Operación elegida: **Crear un Vehículo** (la que recomienda el banco). Practica contarla en voz alta
> abriendo cada archivo. Las partes marcadas **[BACKEND]** pertenecen al proyecto `autocare-360` (Spring
> Boot), no a este repo.

### Ida (del clic a PostgreSQL)

**1. Navegación** — El usuario hace clic en "Vehículos" (`Sidebar.tsx:7`). `NavLink` cambia la URL a
`/vehiculos` sin recargar. `AppRouter.tsx:16` elige `VehiculosPage`, que se dibuja en el `<Outlet />` de
`MainLayout`.

**2. Carga de datos** — `VehiculosPage.tsx:18-19` llama a `useVehiculos()` y `useClientes()`. Cada uno usa
`useAsyncList`, cuyo `useEffect` hace `GET /api/vehiculos` y `GET /api/clientes` en paralelo con
`AbortController`. Mientras tanto: "Cargando vehiculos...". Al llegar: `setData` → re-render → se ven la
tabla y el formulario con el select de propietarios activos.

**3. Componente y estado** — El usuario escribe placa `abc123`, VIN, marca, modelo, deja color vacío y elige
"Ana Rojas" en el select. Cada tecla: `onChange` → `handleChange` (`VehiculoForm.tsx:58-70`) →
`setFormData` → re-render. El estado `formData` es de tipo `VehiculoFormData` (todo string, `clienteId: "1"`).

**4. Envío y validación** — Clic en "Crear vehiculo" (`type="submit"`) → `handleSubmit`
(`VehiculoForm.tsx:72`) → `e.preventDefault()` → `validarVehiculo(formData, clientes)`: obligatorios,
longitudes del DDL y **RN-01** (el cliente existe y está activo). Si hay errores → se muestran y se corta.

**5. Payload** — Líneas 81-89: `VehiculoFormData` → `VehiculoRequest`:
`{ clienteId: 1, placa: "ABC123", vin: "...", marca: "Toyota", modelo: "Corolla", color: null, activo: true }`.
(Conversión `Number()` después de validar; mayúsculas; vacío → `null`.)

**6. Service** — `setSaving(true)` (botón "Procesando...", deshabilitado) →
`vehiculoService.crear(payload)` (`vehiculoService.ts:14-19`) →
`apiFetch('/vehiculos', { method: 'POST', body: JSON.stringify(data) })`.

**7. apiClient / fetch** — `apiClient.ts`: comprueba `API_URL`, agrega `Content-Type: application/json` y
`X-Usuario-Id: 2`, y llama a `fetch('http://localhost:9090/api/vehiculos', ...)`.

**8. HTTP** — El navegador envía el preflight `OPTIONS` (por el JSON y el header propio) y luego el
`POST /api/vehiculos` con el JSON en el body.

**9. [BACKEND]** — `CorsConfig` permite el origen `http://localhost:5173` → el `@RestController` de vehículos
recibe el `@RequestBody` → `@Valid` revisa el DTO (si falla: **400** con `fieldErrors`) → el caso de uso
busca el cliente 1 (no existe: **404**; inactivo: **409** RN-01), revisa placa/VIN únicos (**409**) →
el repositorio hace el `INSERT`.

**10. [BACKEND] Persistencia** — PostgreSQL inserta la fila en `autocare.vehiculo`, aplica `NOT NULL`,
`UNIQUE(placa)`, `UNIQUE(vin)` y la `FOREIGN KEY` a `cliente`, y **genera el `id`** (ej. 15). Si dos usuarios
enviaron la misma placa al mismo tiempo, aquí falla uno y el `GlobalExceptionHandler` lo convierte en 409.

### Vuelta (de PostgreSQL a la pantalla)

**11. Respuesta** — El backend responde **201 Created** con el `VehiculoResponse` en JSON:
`{ "id": 15, "clienteId": 1, "placa": "ABC123", ... }`.

**12. apiFetch** — `response.ok` es true → `response.json()` → objeto JavaScript `Vehiculo`. (Si fuera 4xx/5xx:
`toApiError` → `throw ApiError` con el `message` del backend.)

**13. Formulario** — `VehiculoForm.tsx:98-100`: `onSaved(creado, 'create')` y limpia el formulario.
`finally` → `setSaving(false)`.

**14. Estado de la página** — `VehiculosPage.handleSaved` (líneas 79-88):
`setVehiculos(prev => [...prev, saved])` con el objeto **del servidor** (con `id: 15`), y
`showSuccess('Vehiculo creado correctamente')`.

**15. Re-render** — React vuelve a ejecutar `VehiculosPage`: reconstruye `clientesById`, filtra, pagina, y
`VehiculoTable` dibuja la nueva fila con `key={15}`; la columna Propietario resuelve "Ana Rojas" con
`clientesById.get(1)`. Aparece el mensaje verde durante 2.5 s.

### Frontend vs. backend (qué es de quién)

| Frontend (este repo) | Backend (`autocare-360`) |
|---|---|
| Pasos 1–8 y 12–15: navegación, estado, validación de UX, payload, petición, mostrar resultado o error | Pasos 9–11: CORS, validación de verdad, reglas de negocio, persistencia, generar id, códigos de estado |

### Dónde se rompería el flujo y cómo lo vería

| Falla | Qué capa lo detecta | Qué ves en Network | Qué ve el usuario |
|---|---|---|---|
| **URL incorrecta** (puerto 8080 o sin `/api`) | Backend/servidor (404) o red (sin servidor) | 404 o `(failed) net::ERR_CONNECTION_REFUSED` | Mensaje de error en el form |
| **Backend apagado** | `fetch` (error de red) | `(failed)` sin status | "Failed to fetch" en el form |
| **CORS** | El navegador | "CORS error", OPTIONS sin `Access-Control-Allow-Origin` | "Failed to fetch"; en consola el detalle |
| **Payload inválido** (saltando la validación del front) | `@Valid` del backend | 400 + `fieldErrors` | "Datos invalidos: ..." |
| **Cliente inexistente** | Service del backend | 404 | Mensaje del backend |
| **Placa duplicada / cliente inactivo** | Backend o constraint UNIQUE | 409 | "Ya existe un vehículo con placa..." |
| **Error interno** | Backend | 500 | Mensaje de error, el form conserva los datos |
| **Shape inesperado** (ej. backend devuelve `{ data: {...} }`) | Nadie automáticamente (TypeScript no valida en runtime, P04) | 201 con otro JSON | Fila vacía o rota en la tabla |

En todos los casos de error, la tabla **no cambia** y el formulario **conserva** lo escrito.

**Repregunta de presión**: *Si el POST aparece 201 en Network y PostgreSQL tiene el registro, pero la
pantalla no lo muestra, ¿dónde termina el problema y cómo lo demostrarías?*

El backend y la base **funcionaron**: el 201 y la fila en PostgreSQL lo prueban. El problema está **en el
frontend, después de la respuesta**: entre el paso 12 y el 15. Lo demostraría así:
1. **Network → Response** del POST: ¿trae el vehículo con `id` y los nombres de campo que espera mi
   interfaz (`clienteId`, `placa`)? Si el shape es otro, ahí está el problema (contrato).
2. **Breakpoint** (o `console.log`) en `VehiculoForm.tsx:99`: ¿se ejecuta `onSaved`? Si no se llega, algo
   lanzó error antes (por ejemplo `response.json()` sobre un body vacío) y debería verse en `apiError`.
3. **Breakpoint en `handleSaved`** (`VehiculosPage.tsx:80`): ¿se llama? ¿`saved` tiene datos?
4. **React DevTools**: inspecciono el estado del hook de vehículos: ¿el nuevo vehículo está en `data`?
5. Si **sí** está en el estado pero no en la tabla: es la **vista derivada**: un filtro o búsqueda activa lo
   excluye, o quedó en otra **página** (se agrega al final). Limpio filtros y voy a la última página.
6. Prueba final: **recargo la página**. Si al recargar aparece (porque el GET lo trae), queda demostrado que
   el problema era la actualización del estado local después del POST, no el backend.
