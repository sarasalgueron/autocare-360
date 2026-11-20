# Bloque A — Arquitectura, Vite, TypeScript y Router (preguntas 01–10)

[← Volver al índice](README.md)

---

## PREGUNTA 01 — CRÍTICA
### Dibuja la arquitectura real de tu frontend y explica el recorrido entre sus carpetas.

**Idea simple**

Piensa en un restaurante. El mesero (componente) toma tu pedido, pero no cocina; se lo pasa a la cocina
(service), que usa los utensilios comunes (apiClient) para preparar el plato pidiéndole ingredientes al
proveedor (backend). Si el mesero cocinara, sería un caos: cada mesero cocinaría distinto.
La arquitectura de carpetas sirve para eso: **cada pieza tiene una sola responsabilidad**.

**Tu estructura real (`src/`)**

```
src/
├── main.tsx                 → punto de entrada: monta React en el HTML
├── app/                     → piezas globales de la aplicación
│   ├── App.tsx              → raíz de componentes (solo devuelve <AppRouter/>)
│   ├── AppErrorBoundary.tsx → atrapa errores de render
│   └── SesionDemoProvider.tsx / sesionDemoContext.ts → usuario demo (sin login)
├── routes/AppRouter.tsx     → tabla de rutas: qué URL muestra qué página
├── layouts/MainLayout.tsx   → marco fijo: Sidebar + Header + <Outlet/>
├── pages/                   → páginas que no son de un dominio: DashboardPage, NotFoundPage
├── components/
│   ├── common/              → Sidebar, Header (partes del layout)
│   └── ui/                  → Button, Modal, ConfirmDialog, Pagination... (NO conocen el dominio)
├── features/                → una carpeta por capacidad de negocio
│   ├── clientes/  { models, types, services, hooks, utils, components, pages, data }
│   ├── vehiculos/ { ...igual }
│   ├── servicios/ , ordenes/ , usuarios/
├── shared/                  → código reutilizable sin dominio
│   ├── hooks/useAsyncList.ts
│   ├── utils/ (paginate, filters, isAbortError, format)
│   └── session/sesionDemo.ts
├── api/apiClient.ts         → apiFetch + ApiError: la mecánica HTTP común
├── config/env.ts            → único lugar que lee import.meta.env
├── styles/                  → tokens.css, global.css, ui.css
└── test/setup.ts            → configuración de los tests
```

**Dirección del flujo (esto es lo importante)**

```
routes → layouts → pages → (components + hooks) → services → api/apiClient → config/env
```

Las flechas van **en un solo sentido**. Una página puede usar un service, pero un service nunca importa una
página. Un componente de `ui/` nunca importa nada de `features/`.

Ejemplo concreto con Clientes:
1. `AppRouter.tsx:15` dice: la URL `/clientes` muestra `ClientesPage`.
2. `ClientesPage.tsx:17-23` pide los datos al hook `useClientes()`.
3. `useClientes.ts:7` usa el hook genérico `useAsyncList` pasándole `clienteService.listar`.
4. `clienteService.ts:9-11` sabe que listar es `GET /clientes` y llama a `apiFetch`.
5. `apiClient.ts:53` arma la URL completa con `API_URL` (de `config/env.ts`) y llama a `fetch`.

**Organización física vs. responsabilidad arquitectónica**

- *Física*: dónde está el archivo (la carpeta).
- *Arquitectónica*: qué hace y de quién puede depender.

Tener una carpeta `services/` no garantiza nada si un componente igual hace `fetch` directo. Lo que
importa es la **regla**: *solo los services conocen rutas HTTP y todo pasa por `apiFetch`*. En tu proyecto
puedes comprobarlo: busca `fetch(` en `src/` y solo aparece en `apiClient.ts`.

**Por qué por features y no por tipo**

La alternativa era una carpeta `components/` gigante con todo junto (ClienteForm, VehiculoTable,
Button...). Con features, todo lo de Clientes está junto: si mañana hay que cambiar Clientes, abres una
sola carpeta. Y si borras la feature, no queda basura repartida por todo el proyecto.

**Repregunta de presión**: *Si muevo toda la lógica HTTP dentro de un componente visual, ¿funciona? ¿Qué
problema aparece?*

**Sí, funcionaría**: `fetch` se puede llamar desde cualquier lado. Pero aparece **acoplamiento**:
- La tabla quedaría "pegada" al backend: no la podrías reutilizar con otros datos ni probarla sin servidor.
- La URL `/clientes` estaría repetida en varios componentes. Si el backend cambia la ruta, tendrías que
  buscarla en todos lados en vez de cambiarla una vez en `clienteService.ts`.
- Perderías el tratamiento común de errores de `apiFetch` (revisar `response.ok`, convertir a `ApiError`,
  enviar el header `X-Usuario-Id`). Cada componente lo haría a su manera, o se le olvidaría.

---

## PREGUNTA 02
### Explica qué problema resuelve Vite y qué ocurre en `npm install`, `npm run dev` y `npm run build`.

**Idea simple**

El navegador **no entiende** TypeScript ni JSX (`<ClienteTable />`). Solo entiende JavaScript, HTML y CSS.
Alguien tiene que traducir tu código. **Vite** es esa herramienta: traduce, sirve el código mientras
programas, y al final lo empaqueta optimizado para producción.

**Tres herramientas distintas (no las confundas)**

| Herramienta | Qué es | Qué hace |
|---|---|---|
| **npm** | Gestor de paquetes | Descarga librerías (React, Vite, Vitest...) y ejecuta scripts |
| **Vite (dev)** | Servidor de desarrollo | Sirve tu app en `http://localhost:5173` y la actualiza al guardar |
| **Vite (build)** | Build tool / bundler | Genera la carpeta `dist/` optimizada para producción |

**Qué pasa en cada comando** (mira `package.json`):

1. **`npm install`**
   - Lee `package.json` (qué librerías necesitas y en qué rango de versión: `"react": "^19.2.8"`).
   - Lee `package-lock.json` (la versión **exacta** que se instaló la última vez).
   - Descarga todo en la carpeta `node_modules/`.
   - No ejecuta tu app ni compila nada.

2. **`npm run dev`** → ejecuta `vite`
   - Levanta un servidor local en el puerto 5173.
   - Cuando el navegador pide `/src/main.tsx`, Vite lo **transforma al vuelo** de TSX a JS (quita los tipos
     y convierte el JSX en llamadas de React). Ojo: en `dev` Vite **no revisa los errores de tipos**, solo
     los quita. Los errores de tipo los ves en WebStorm o en `npm run build`.
   - **HMR (Hot Module Replacement)**: cuando guardas un archivo, Vite reemplaza solo ese módulo en el
     navegador sin recargar toda la página. Por eso ves el cambio al instante y muchas veces sin perder el
     estado de la pantalla.
   - Carga las variables de `.env.development`.

3. **`npm run build`** → ejecuta `tsc -b && vite build`
   - `tsc -b`: TypeScript **revisa los tipos** de todo el proyecto. Si hay un error de tipo, el build se
     detiene aquí (el `&&` significa "solo sigue si lo anterior salió bien").
   - `vite build`: junta todos tus archivos en pocos archivos (bundle), quita espacios y comentarios
     (minifica), elimina código no usado y les pone un hash en el nombre (`index-BHSYwr6v.js`) para que el
     navegador no use una versión vieja en caché.
   - Usa las variables de `.env.production`.
   - Resultado real de tu proyecto: `dist/index.html`, `dist/assets/index-*.css` (9.8 kB) y
     `dist/assets/index-*.js` (304 kB).

**Vite no reemplaza a React ni a TypeScript**

- React es la librería que dibuja la interfaz (componentes, estado).
- TypeScript es el lenguaje con tipos (y `tsc` el que revisa los tipos).
- Vite es solo la herramienta que traduce y empaqueta. Sin React, Vite no sabe hacer componentes.

**Repregunta de presión**: *Si eliminas `node_modules` pero conservas `package.json` y `package-lock.json`,
¿cómo recuperas el proyecto?*

Ejecutas **`npm install`** (o `npm ci`, que instala exactamente lo del lock y es lo típico en servidores).
`node_modules` es solo una carpeta **descargable**: se puede regenerar siempre. La "receta" está en
`package.json` y las versiones exactas en `package-lock.json`. Por eso `node_modules` **no se sube a git**
(está en `.gitignore`) y el `package-lock.json` **sí**: garantiza que tu compañero o el profesor instalen
las mismas versiones que tú.

---

## PREGUNTA 03
### Explica el arranque real del frontend: `index.html → main.tsx → App.tsx → Router → pantalla`.

**Idea simple**

El HTML es una caja vacía. React llega después y dibuja todo dentro de esa caja.

**Recorrido paso a paso con tu código**

1. **`index.html`** (en la raíz del proyecto)
   - Línea 9: `<div id="root"></div>` → la caja vacía.
   - Línea 10: `<script type="module" src="/src/main.tsx">` → le dice al navegador que cargue tu código.
   - Si abres "Ver código fuente" en el navegador, solo verás esto: no aparece ninguna tabla de clientes.
     Eso demuestra que la UI la crea React dinámicamente.

2. **`src/main.tsx`**
   - Líneas 6-8: importa los estilos globales (`tokens.css`, `global.css`, `ui.css`).
   - Línea 10: `createRoot(document.getElementById('root')!)` → busca la caja `#root` y crea ahí la
     "raíz" de React. El `!` le dice a TypeScript "confía, no es null".
   - `.render(...)` dibuja este árbol:
     ```
     <StrictMode>              → modo de desarrollo que detecta errores (ver P40)
       <AppErrorBoundary>      → si algo falla al dibujar, muestra un mensaje (ver P46)
         <BrowserRouter>       → activa el router: lee la URL del navegador
           <App />
     ```

3. **`src/app/App.tsx`** línea 4: solo devuelve `<AppRouter />`.

4. **`src/routes/AppRouter.tsx`**
   - `<Routes>` mira la URL actual y elige qué `<Route>` coincide.
   - Línea 13: `<Route element={<MainLayout />}>` es una ruta "padre" sin `path`: envuelve a todas las demás.
   - Línea 14: `index` → la URL `/` muestra `DashboardPage`.
   - Línea 15: `path="clientes"` → `/clientes` muestra `ClientesPage`.

5. **`src/layouts/MainLayout.tsx`**: dibuja `Sidebar`, `Header` y en la línea 15 `<Outlet />`, el hueco
   donde aparece la página elegida.

6. **La página** (ej. `ClientesPage`) se ejecuta, pide los datos y se muestra.

**HTML base vs. UI dinámica**

- HTML base: fijo, casi vacío, lo entrega el servidor (`index.html`).
- UI dinámica: la crea React en el navegador con JavaScript, y la cambia cada vez que cambia el estado,
  sin pedir otra página HTML al servidor. Eso es una **SPA** (Single Page Application).

**Repregunta de presión**: *Si `main.tsx` apunta a un id que no existe en `index.html`, ¿qué ocurre?*

`document.getElementById('raiz')` devuelve **`null`**. El `!` solo engaña a TypeScript, no cambia lo que
pasa de verdad. `createRoot(null)` lanza un error en la consola (React avisa que el contenedor no es un
elemento DOM) y **la pantalla queda en blanco**. Lo diagnosticas abriendo la consola de DevTools (F12).
Ni siquiera el `AppErrorBoundary` puede ayudar, porque el error ocurre antes de que React exista.

---

## PREGUNTA 04
### Diferencia `interface`, `type` y los tipos reales en tiempo de ejecución usando Cliente y Vehículo.

**Idea simple**

Los tipos de TypeScript son como los **planos** de una casa: te ayudan mientras construyes, pero cuando la
casa está terminada, los planos no están dentro de las paredes. Cuando el código se compila a JavaScript,
**todos los tipos se borran**. En el navegador no existe `Cliente`.

**Dónde están en tu proyecto**

- `features/clientes/models/Cliente.ts` → `interface Cliente` (lo que devuelve el backend).
- `features/clientes/types/ClienteFormData.ts` → `interface ClienteFormData` (lo que se escribe en el form).
- `features/clientes/types/ClienteRequests.ts` →
  `type ClienteCreateRequest = Omit<Cliente, 'id'>` (lo que se envía en POST/PUT).
- `features/vehiculos/models/Vehiculo.ts` → `interface Vehiculo`.
- `features/vehiculos/types/VehiculoFormData.ts` → `interface VehiculoFormData` y `interface VehiculoRequest`.
- `components/ui/Button.tsx:3` → `type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'`.

**interface vs type**

| | `interface` | `type` |
|---|---|---|
| Para qué se usa | Describir la forma de un objeto | Cualquier tipo: objetos, uniones, combinaciones |
| Ejemplo tuyo | `interface Cliente { id: number; ... }` | `type ButtonVariant = 'primary' \| 'danger'` |
| Uniones (`A \| B`) | No puede | Sí |
| Tipos derivados (`Omit`, `&`) | Con `extends` | Sí: `Omit<Cliente,'id'>`, `ButtonHTMLAttributes & {...}` |

**Cuándo uso cada uno (justificación)**: uso `interface` para los objetos del dominio (Cliente, Vehiculo,
FormData) porque describen "la forma de un objeto". Uso `type` cuando necesito algo que una interface no
puede: una **unión** de textos (`EstadoFiltro = 'all' | 'active' | 'inactive'` en `shared/utils/filters.ts:6`)
o un tipo **calculado** a partir de otro (`Omit<Cliente, 'id'>`).

**Ninguno de los dos crea objetos.** `interface Cliente` no crea un cliente. Los objetos los crea el código
JavaScript real, por ejemplo `response.json()` en `apiClient.ts:66`.

**Tiempo de compilación vs. tiempo de ejecución (runtime)**

- **Compilación** (cuando escribes y cuando corre `tsc -b`): TypeScript te avisa si escribes
  `cliente.nombre` (no existe, se llama `nombreCompleto`) o si pasas un string donde va un number.
- **Runtime** (en el navegador): ya no hay tipos. Si el backend manda algo distinto, nadie lo revisa
  automáticamente.

**Repregunta de presión**: *Si el backend envía un JSON con un campo faltante, ¿TypeScript lo bloquea en
runtime?*

**No.** Mira `apiClient.ts:66`: `return response.json() as Promise<T>;`. Ese `as` es una **promesa que le
hacemos a TypeScript** ("créeme, esto es un Cliente[]"), no una verificación. Si el backend no manda
`nombreCompleto`, el objeto llega sin ese campo y en la tabla se verá una celda vacía (o `undefined`), sin
ningún error de TypeScript. Para validar en runtime habría que escribir código que revise los datos (a mano
o con una librería como Zod), algo que las guías del curso no piden. La verdadera protección es que el
**contrato** (Swagger del backend) y tus interfaces coincidan.

---

## PREGUNTA 05 — CRÍTICA
### ¿Por qué el frontend no debe copiar ciegamente las `@Entity` JPA del backend? Defiende tus contratos TypeScript.

**Idea simple**

La `@Entity` es cómo el backend **guarda** los datos en la base. El frontend no ve la base de datos: ve lo
que el backend **decide enviar** por HTTP (el DTO). Y el formulario necesita su propia forma, porque lo que
el usuario escribe no es igual a lo que se guarda.

**Hay tres modelos distintos (y en tu proyecto existen los tres)**

| Modelo | Dónde | Para qué |
|---|---|---|
| Persistencia (`@Entity`) | Backend Java | Mapear la tabla `autocare.cliente`. Puede tener relaciones JPA, campos internos, auditoría |
| Contrato HTTP (DTO) | `ClienteResponse` / `ClienteRequest` del backend ↔ `Cliente.ts` y `ClienteRequests.ts` | Lo que viaja en el JSON |
| Modelo de UI | `ClienteFormData.ts`, `VehiculoFormData.ts` | Lo que el usuario está escribiendo |

**Ejemplo real de por qué difieren**

```ts
// Cliente.ts — lo que llega del backend
email: string | null;      // en la base puede ser NULL

// ClienteFormData.ts — lo que maneja el formulario
email: string;             // un <input> necesita '' para estar vacío, no null
```

```ts
// Vehiculo.ts           → clienteId: number   (así viaja en JSON)
// VehiculoFormData.ts   → clienteId: string   (un <select> entrega texto)
```

La conversión entre ellos está en:
- `ClienteForm.tsx:42-43`: `email: cliente.email ?? ''` (null → '' al cargar para editar).
- `ClienteForm.tsx:74-75`: `email: ... || null` (vacío → null al enviar).
- `VehiculoForm.tsx:48` `String(vehiculo.clienteId)` y `:82` `Number(formData.clienteId)`.

Además, el `Vehiculo` del front tiene `clienteId: number`, **no** un objeto `cliente` completo. En JPA la
entidad probablemente tenga `@ManyToOne Cliente cliente`. Si copiáramos eso, cada vehículo traería al
cliente entero (y quizá el cliente traería sus vehículos → ciclo infinito al convertir a JSON).

**Riesgos de copiar la Entity**

1. **Acoplamiento**: si el backend cambia la base (renombra una columna), se rompe el frontend aunque la API
   no tendría por qué cambiar.
2. **Campos internos**: contraseñas hash, fechas de auditoría, versiones de bloqueo... cosas que el front no
   debe ver ni enviar.
3. **Relaciones JPA**: objetos anidados, ciclos, carga perezosa.

**Mi defensa**: mis interfaces siguen el **contrato HTTP** (el Swagger del backend), no la Entity. Por eso en
`Cliente.ts:1` dice "Contrato de ClienteResponse (backend)".

**Repregunta de presión**: *Si el backend renombra `idCliente` a `id` y el frontend tiene un adapter,
¿dónde se concentra el cambio?*

Un **adapter** es una función que traduce la respuesta del backend al modelo del front
(ej. `toCliente(dto) => ({ id: dto.idCliente, ... })`). Si existe, el cambio se hace **solo en el adapter**
y el resto del frontend (tablas, formularios, filtros) no se entera. En mi proyecto no tengo adapters
porque el contrato ya coincide con mis interfaces; el lugar natural para ponerlo sería el **service**
(`clienteService.ts`), justo después de `apiFetch`, porque es la única capa que conoce el backend.

---

## PREGUNTA 06 — CRÍTICA
### Explica el recorrido exacto de una URL como `/clientes` dentro de React Router.

**Idea simple**

El router es como el índice de un libro: miras la URL y te dice qué página mostrar, **sin pedirle una
página nueva al servidor**.

**Recorrido con tu código**

1. El usuario hace clic en "Clientes" del menú (`Sidebar.tsx:24`, un `NavLink to="/clientes"`).
2. `NavLink` cambia la URL del navegador a `/clientes` usando la History API (sin recargar).
3. **`BrowserRouter`** (`main.tsx:13`) detecta que la URL cambió y avisa a todos los componentes del router.
4. **`<Routes>`** (`AppRouter.tsx:12`) revisa sus `<Route>` hijos y busca cuál coincide con `/clientes`.
5. Encuentra la ruta padre `<Route element={<MainLayout />}>` (línea 13) y, dentro, la hija
   `<Route path="clientes" element={<ClientesPage />} />` (línea 15).
6. Como es una ruta anidada, React Router dibuja primero el **padre** → `MainLayout`.
7. `MainLayout` dibuja Sidebar y Header, y en `<Outlet />` (`MainLayout.tsx:15`) React Router coloca el
   elemento de la ruta **hija** → `ClientesPage`.
8. `ClientesPage` se monta y su hook `useClientes` empieza a pedir los datos al backend.

```
BrowserRouter → Routes → Route(MainLayout) → MainLayout → Outlet → Route("clientes") → ClientesPage
```

**`Route` decide qué elemento renderizar**: compara su `path` con la URL. Si no coincide ninguna, se usa
`path="*"` (línea 19) → `NotFoundPage`. Fíjate que el `*` está **dentro** del layout, por eso la página 404
sigue mostrando el menú.

**Repregunta de presión**: *¿Qué diferencia hay entre `/clientes` del frontend y
`http://localhost:9090/api/clientes` del backend?*

Aunque se parezcan, son cosas totalmente distintas:

| | `/clientes` (frontend) | `http://localhost:9090/api/clientes` (backend) |
|---|---|---|
| Quién lo atiende | React Router, dentro del navegador | Un `@RestController` de Spring Boot |
| Qué devuelve | Una **pantalla** (componentes React) | **Datos JSON** |
| Dónde se define | `AppRouter.tsx:15` | `clienteService.ts:10` + el controller Java |
| Servidor | Vite en `:5173` | Spring Boot en `:9090` |
| ¿Viaja por red? | No (cambio interno) | Sí, petición HTTP real (se ve en Network) |

La ruta del front es **lo que ve el usuario**; el endpoint es **de dónde salen los datos**. Podría llamar a
la pantalla `/mis-clientes` y seguiría pidiendo los datos a `/api/clientes`.

---

## PREGUNTA 07
### Diferencia `Link`, `NavLink`, navegación declarativa y estado activo del menú.

**Idea simple**

Un `<a href>` normal hace que el navegador **pida una página nueva** al servidor: se recarga todo, se borra
el estado de React y se vuelve a descargar el JavaScript. `Link` y `NavLink` cambian la URL **sin recargar**:
React Router solo cambia el componente que se ve.

**En tu proyecto**

- **`Link`**: `NotFoundPage.tsx:9` → `<Link to="/">Volver al inicio</Link>`. Un enlace simple.
- **`NavLink`**: `Sidebar.tsx:24-33`. Es un `Link` que además **sabe si su ruta es la actual**.

```tsx
<NavLink
    to={item.to}
    end={item.end}
    className={({ isActive }) =>
        `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
    }
>
```

- `className` recibe una **función**: React Router le pasa `{ isActive }` y tú decides la clase CSS.
  Así el ítem del menú se pinta resaltado cuando estás en esa página.
- `end` (solo en "Inicio", línea 4): sin `end`, la ruta `/` coincidiría con **todas** las URLs (porque
  todas empiezan con `/`) y "Inicio" estaría siempre activo.

**Navegación declarativa**: *declaras* "este enlace lleva a `/clientes`" y React Router se encarga de cómo.
Lo opuesto es la navegación imperativa (`navigate('/clientes')` dentro de una función), útil por ejemplo
después de guardar un formulario.

**El menú se genera con datos**: `menuItems` (líneas 3-9) es un array y se recorre con `map` (línea 23).
Para agregar una opción, agregas un objeto al array.

**Repregunta de presión**: *Si usas `window.location` para cada opción del menú, ¿qué pierdes?*

`window.location.href = '/clientes'` hace una **recarga completa**. Pierdes:
1. **El estado de React**: lo que estaba escrito en un formulario, el usuario demo seleccionado en memoria,
   los datos ya cargados.
2. **Velocidad**: se vuelve a descargar y ejecutar todo el JavaScript; se ve un parpadeo blanco.
3. **El estado activo automático** de `NavLink` (tendrías que calcularlo tú).
4. Es decir, pierdes el comportamiento de **SPA**: dejaría de ser una aplicación de una sola página.

---

## PREGUNTA 08
### Diferencia Layout, Page, Feature y componente UI reutilizable usando archivos reales.

**Idea simple** — piensa en una casa:
- **Layout** = la estructura que no cambia (paredes, techo): siempre está.
- **Page** = cada habitación (cocina, dormitorio): lo que cambia según donde estés.
- **Feature** = un área completa de la casa con todo lo suyo (la cocina con sus muebles y utensilios).
- **UI reutilizable** = los enchufes e interruptores: iguales en todas las habitaciones y no saben en qué
  habitación están.

| Concepto | Archivo real | Responsabilidad |
|---|---|---|
| **Layout** | `layouts/MainLayout.tsx` | Estructura persistente: Sidebar + Header + `<Outlet/>`. No se vuelve a montar al cambiar de página |
| **Page** | `features/clientes/pages/ClientesPage.tsx`, `features/vehiculos/pages/VehiculosPage.tsx`, `pages/DashboardPage.tsx` | Compone una pantalla: tiene el estado, llama a hooks/services y reparte datos a sus hijos |
| **Feature** | `features/clientes/` completa | Agrupa todo lo de un dominio: modelo, tipos, service, hook, validación, filtros, form, tabla, página |
| **UI reutilizable** | `components/ui/Button.tsx`, `Modal.tsx`, `ConfirmDialog.tsx`, `Pagination.tsx`, `StatusBadge.tsx`... | Piezas visuales genéricas; **no importan nada de `features/`** |

**Cómo comprobar el límite**: abre `ConfirmDialog.tsx`. El comentario de la línea 14 dice: "No conoce
Cliente ni Vehiculo". Recibe `title`, `message`, `onConfirm` y `onCancel`; el mismo componente sirve para
borrar clientes, vehículos y servicios.

**Evitar el "cajón de sastre"**: si todo va a `components/`, termina siendo una carpeta con 80 archivos
mezclados donde no sabes qué depende de qué. La regla que uso: **si conoce el dominio (Cliente, Vehiculo),
va dentro de su feature; si no lo conoce y se repite, va a `components/ui`**. Además separé
`components/common/` (Sidebar, Header: partes del layout que solo se usan una vez).

**Repregunta de presión**: *¿Dónde pondrías un `StatusBadge` genérico y dónde un `VehiculoForm`?*

- **`StatusBadge`** → `components/ui/StatusBadge.tsx` (ahí está). Solo recibe `active: boolean` y muestra
  "Activo"/"Inactivo". Lo usan la tabla de clientes, la de vehículos y la de servicios.
- **`VehiculoForm`** → `features/vehiculos/components/VehiculoForm.tsx` (ahí está). Conoce `Vehiculo`,
  `VehiculoFormData`, `vehiculoService`, la regla RN-01... No tiene sentido fuera de Vehículos.

Nota: tengo un caso intermedio, `features/ordenes/components/EstadoOrdenBadge.tsx`. Es un badge pero conoce
los estados de una orden (`ABIERTA`, `EN_TRABAJO`...), por eso vive en la feature y no en `ui/`.

---

## PREGUNTA 09
### Explica `import.meta.env`, las variables `VITE_*` y por qué no debes guardar secretos ahí.

**Idea simple**

La URL del backend cambia según dónde corra la app: en tu PC es `localhost:9090`, en producción será otra.
En vez de escribirla fija en el código, se pone en un archivo `.env` y Vite la **inserta en el código**
cuando compila.

**En tu proyecto**

| Archivo | Contenido | Cuándo se usa |
|---|---|---|
| `.env.development` | `VITE_API_URL=http://localhost:9090/api` | `npm run dev` |
| `.env.production` | `VITE_API_URL=https://api.autocare360.example.com/api` (ejemplo) | `npm run build` |
| `.env.example` | Plantilla para quien clone el repo | Nunca la lee Vite: es documentación |

- `config/env.ts:3`: `export const API_URL = import.meta.env.VITE_API_URL;` → **único lugar** que lee
  variables de entorno. El resto del código importa `API_URL`.
- `apiClient.ts:42-44`: si `API_URL` no existe, lanza `'Falta VITE_API_URL'` (falla claro en vez de llamar
  a `undefined/clientes`).
- `apiClient.ts:53`: `fetch(\`${API_URL}${endpoint}\`)` → `http://localhost:9090/api` + `/clientes`.

**Por qué el prefijo `VITE_`**: Vite solo expone al código del navegador las variables que empiezan con
`VITE_`. Es una protección: si en el `.env` tuvieras `DB_PASSWORD=...`, Vite no la incluiría.

**Cómo funciona realmente**: al compilar, Vite **reemplaza el texto** `import.meta.env.VITE_API_URL` por el
valor literal `"http://localhost:9090/api"`. O sea, la URL queda **escrita dentro del JavaScript** que se
descarga el usuario.

**Repregunta de presión**: *¿Por qué una password de base de datos en `VITE_DB_PASSWORD` sería un error
grave aunque esté en `.env`?*

Porque el prefijo `VITE_` significa justamente "**inclúyela en el JavaScript del navegador**". Cualquier
persona que abra tu página puede presionar F12 → Sources (o descargar `dist/assets/index-*.js`) y leer la
contraseña en texto plano. El archivo `.env` no es secreto una vez compilado: su contenido viaja a todos
los navegadores. **Regla: el frontend no tiene secretos.** Las credenciales de la base viven solo en el
backend (`application.properties` o variables de entorno del servidor). Eso mismo dice el comentario de tu
`.env.production`: "Nunca poner secretos aqui: todo VITE_ termina dentro del JavaScript del navegador".

---

## PREGUNTA 10
### Explica el flujo unidireccional de datos en React: props hacia abajo y eventos/callbacks hacia arriba.

**Idea simple**

Los datos bajan como el agua en una cascada: del padre a los hijos (**props**). Los hijos no pueden empujar
el agua hacia arriba; lo que hacen es **avisar** al padre ("me hicieron clic aquí") llamando a una función
que el padre les dio (**callback**). El padre decide qué hacer y, si cambia su estado, los nuevos datos
vuelven a bajar.

**Ejemplo real: `ClientesPage` ↔ `ClienteTable`**

```
                ClientesPage (dueña del estado: clientes, pendingDelete...)
                     │  props hacia abajo:
                     │    clientes={visible}
                     │    onEdit={handleEdit}
                     │    onDelete={setPendingDelete}
                     ▼
                ClienteTable (solo dibuja)
                     │  evento hacia arriba:
                     │    clic en "Editar" → onEdit(cliente.id)
                     ▲
```

- `ClientesPage.tsx:158-162` pasa las props.
- `ClienteTable.tsx:5-9` declara qué recibe: `clientes`, `onEdit`, `onDelete`.
- `ClienteTable.tsx:38`: `onClick={() => onEdit(cliente.id)}` → **avisa** con el id.
- `ClientesPage.tsx:58` `handleEdit(id)` decide: pedir el cliente al backend y guardarlo en `editingCliente`.
- Ese cambio de estado provoca un re-render y `editingCliente` **baja** al formulario como prop
  `cliente={editingCliente}` (línea 129).

**Props vs. estado local**

| | Props | Estado (`useState`) |
|---|---|---|
| ¿De quién es? | Del padre | Del propio componente |
| ¿Se puede cambiar? | No, son de solo lectura para el hijo | Sí, con su `setX` |
| Ejemplo | `clientes` en `ClienteTable` | `formData` en `ClienteForm.tsx:28` |

**¿Por qué el hijo no debe mutar el estado del padre?** Si `ClienteTable` hiciera
`clientes.splice(0, 1)`, modificaría el array directamente. React **no se entera** (no se llamó a ningún
`setX`), así que no vuelve a dibujar, y la pantalla queda desincronizada de los datos. Además, el padre
pierde el control: ya no hay un único lugar donde cambian los datos y cuesta encontrar errores.

**Repregunta de presión**: *Cuando `ClienteTable` hace clic en Editar, ¿cómo llega esa intención hasta
`ClientesPage` sin que la tabla haga un PUT?*

La tabla recibió `onEdit` como prop. Al hacer clic, ejecuta `onEdit(cliente.id)`, que en realidad es la
función `handleEdit` de la página. La tabla **no sabe** qué hace esa función: solo comunica "el usuario
quiere editar el 7". La página hace el GET `/clientes/7` y pone el cliente en el formulario. El PUT lo
envía después el formulario, cuando el usuario presiona "Actualizar cliente". La tabla nunca importa un
service (compruébalo: `ClienteTable.tsx` solo importa `Button`, `StatusBadge` y el tipo `Cliente`).
