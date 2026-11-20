# Bloque B — Componentes, estado, formularios y UI (preguntas 11–20)

[← Volver al índice](README.md)

---

## PREGUNTA 11 — CRÍTICA
### Explica un input controlado con `useState`, `value` y `onChange`, paso a paso.

**Idea simple**

En un input **controlado**, React es el jefe del valor. El input no guarda lo que escribes por su cuenta:
muestra **exactamente** lo que dice el estado de React. Cuando escribes, el input le "pide permiso" a React
para cambiar.

**Tu código real** (`features/clientes/components/ClienteForm.tsx`)

```tsx
// línea 28: el estado guarda TODOS los campos del formulario
const [formData, setFormData] = useState<ClienteFormData>(initialClienteForm);

// líneas 53-60: un solo manejador para todos los inputs
const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
        ...prev,                                        // copia los demás campos
        [name]: type === 'checkbox' ? checked : value,  // cambia solo este campo
    }));
};

// línea 110: el input
<input name="nombreCompleto" value={formData.nombreCompleto} onChange={handleChange} />
```

**Paso a paso cuando escribes la letra "A"**

1. Presionas "A" en el input de nombre.
2. El navegador dispara el evento `change` y React llama a `handleChange(e)`.
3. `e.target.name` es `"nombreCompleto"` y `e.target.value` es `"A"`.
4. `setFormData(...)` **pide** a React un nuevo estado: una copia de `prev` con `nombreCompleto: "A"`.
   (Ojo: `setFormData` no cambia `formData` en ese instante; programa un nuevo render.)
5. React vuelve a ejecutar la función `ClienteForm` (re-render). Ahora `formData.nombreCompleto` vale `"A"`.
6. React compara el resultado con lo que había en pantalla y actualiza el DOM: `value="A"`.
7. Ves la "A" en el input.

```
tecla → evento onChange → setFormData → re-render → value={formData.nombreCompleto} → pantalla
```

**Detalles que debes saber defender**

- **`[name]`**: es una "propiedad calculada". Por eso cada input necesita su atributo `name` igual al nombre
  del campo en `ClienteFormData`. Un solo `handleChange` sirve para los 5 campos.
- **`...prev`**: el estado no se modifica, se **reemplaza por una copia**. Si hicieras
  `formData.nombreCompleto = 'A'`, React no se enteraría.
- **`(prev) => ...`**: la forma con función usa el estado más reciente garantizado, útil si hay varias
  actualizaciones seguidas.
- **checkbox**: un checkbox usa `checked`, no `value` (línea 127), por eso el `type === 'checkbox'`.
- **Estado React vs. valor del DOM**: el DOM tiene su propio `value` interno, pero en un input controlado
  React lo sobrescribe en cada render con el estado. **La verdad está en `formData`**, no en el DOM. Por eso,
  al enviar, uso `formData` y nunca leo `document.getElementById(...)`.
- **Por qué `email: cliente.email ?? ''`** (línea 42): si `value` recibe `null` o `undefined`, React
  considera el input **no controlado** y avisa en consola cuando luego pasa a tener valor.

**Repregunta de presión**: *¿Qué ocurre si pones `value={nombre}` pero eliminas `onChange`?*

El input queda **congelado**: escribes y no aparece nada. Al presionar una tecla, el DOM intenta cambiar,
pero como nadie llama a `setState`, en el siguiente render React vuelve a poner el valor del estado (el
mismo de antes). Además React muestra un aviso en la consola: *"You provided a `value` prop to a form field
without an `onChange` handler..."* y sugiere usar `readOnly` o `defaultValue`.

---

## PREGUNTA 12
### ¿Por qué `clienteId` (o `anio` en ParkFlow360) puede ser `string` aunque el dominio use `number`?

> En tu proyecto no existe `anio`. El ejemplo equivalente es **`clienteId`** en Vehículos (y `precio` en
> Servicios). Explícalo así para que el profesor vea que conoces tu código.

**Idea simple**

Todo lo que sale de un `<input>` o un `<select>` es **texto**, aunque parezca un número. `e.target.value`
siempre es un `string`. El formulario guarda lo que el usuario está escribiendo **tal cual**; recién al
enviar, cuando ya sabemos que es válido, lo convertimos al tipo que espera el backend.

**Tu código**

```ts
// VehiculoFormData.ts — "lo que el usuario escribe"
clienteId: string;      // el <select> entrega "3", no 3

// VehiculoRequest (mismo archivo, líneas 13-21) — "lo que viaja al backend"
clienteId: number;
```

**El orden correcto: validar → convertir → construir el payload**

1. `VehiculoForm.tsx:76`: `validarVehiculo(formData, clientes)`.
2. `vehiculoValidation.ts:29-37`: revisa que `clienteId` no esté vacío y que corresponda a un cliente
   **existente y activo** (regla RN-01).
3. Si hay errores, `return` (línea 78): no se envía nada.
4. Solo si todo es válido, `VehiculoForm.tsx:81-89` construye el payload tipado `VehiculoRequest` con
   `clienteId: Number(formData.clienteId)`.

Mismo patrón en Servicios: el precio se escribe como texto ("150.50"), se valida con una expresión regular
compatible con `NUMERIC(12,2)` y luego se convierte con `Number()`.

**¿Por qué no guardar `number` directamente en el estado?**

- Un campo vacío no tiene número: `''` es un estado válido mientras el usuario edita. Con `number` tendrías
  que inventar un `0` (que es un id falso) o usar `NaN`.
- Si el usuario escribe "15." o "-", con `number` el input saltaría o se borraría mientras escribe.
- El `<select>` necesita que su `value` coincida con el `value` de una `<option>`, que es texto
  (`value={String(cliente.id)}`, línea 151).

**Repregunta de presión**: *¿Qué riesgo tiene hacer `Number("")` o `Number("abc")` sin validar?*

- **`Number("")` devuelve `0`** → enviarías `clienteId: 0`, un id que no existe. El backend respondería
  404/400, o peor, si existiera un registro 0, lo asignarías al cliente equivocado sin darte cuenta.
- **`Number("abc")` devuelve `NaN`** → `JSON.stringify({ clienteId: NaN })` produce `{"clienteId":null}`.
  Llega `null` al backend, con un error confuso.
- En ambos casos TypeScript **no avisa nada**, porque `Number()` siempre devuelve tipo `number`. Por eso la
  validación tiene que ir **antes**.

---

## PREGUNTA 13
### Explica los eventos tipados del formulario y el uso de `preventDefault()`.

**Idea simple**

Cuando haces algo en la página (escribir, enviar), el navegador crea un objeto "evento" con la información.
TypeScript necesita saber **qué tipo de evento** es para ayudarte con autocompletado y avisarte errores.

**Tipos que usas** (`ClienteForm.tsx:1` los importa con `type ChangeEvent, type FormEvent`)

| Tipo | Dónde | Qué te da |
|---|---|---|
| `ChangeEvent<HTMLInputElement>` | `ClienteForm.tsx:53` | `e.target` es un input: tiene `name`, `value`, `type`, `checked` |
| `ChangeEvent<HTMLInputElement \| HTMLSelectElement>` | `VehiculoForm.tsx:58-60` | Sirve para inputs **y** el select de propietario |
| `FormEvent<HTMLFormElement>` | `ClienteForm.tsx:62` | El evento de envío del formulario |

Detalle fino en `VehiculoForm.tsx:63`: como `e.target` puede ser un `select` (que no tiene `checked`), se
pregunta `e.target instanceof HTMLInputElement && e.target.type === 'checkbox'` antes de leer `checked`.
Eso es TypeScript obligándote a ser correcto.

**`onSubmit` centraliza el envío**

`<form onSubmit={handleSubmit} noValidate>` (línea 98). El botón es `type="submit"` (línea 140). Así el
formulario se envía **tanto con clic como presionando Enter** en cualquier input, y toda la lógica está en
un solo lugar: `handleSubmit`.

`noValidate` desactiva los globitos de validación nativos del navegador (como el de `type="email"`) para
que se muestren **nuestros** mensajes de `validarCliente` de forma consistente.

**`preventDefault()`** (línea 63)

El comportamiento **por defecto** de un `<form>` en HTML es enviar los datos al servidor y **recargar la
página** (o navegar a la URL del atributo `action`). `e.preventDefault()` cancela eso para que lo manejemos
nosotros con JavaScript (validar + `fetch`).

**Repregunta de presión**: *Si no llamas `preventDefault`, ¿qué comportamiento inesperado aparece?*

1. La página **se recarga** al enviar: se pierde todo el estado de React (lo escrito, la lista cargada).
2. La URL cambia a algo como `/clientes?documento=123&nombreCompleto=Ana...` (los datos quedan visibles
   en la barra de direcciones).
3. El `fetch` que empezó `handleSubmit` se **interrumpe** por la recarga: quizás se guardó en el backend,
   quizás no, y el usuario no ve ningún mensaje. Puede terminar creando duplicados al reintentar.

---

## PREGUNTA 14
### Separa validación de UI, validación del backend y constraints de base de datos.

**Idea simple**

Son tres porteros en tres puertas distintas. El primero (frontend) es amable y te avisa rápido si olvidaste
algo, pero **cualquiera puede saltárselo** (por ejemplo con Postman). Los otros dos (backend y base de
datos) son los que realmente protegen los datos.

**Las tres capas con ejemplos reales de AutoCare360**

| Capa | Para qué | Ejemplos | Dónde |
|---|---|---|---|
| **UI (React)** | Experiencia de usuario: feedback inmediato, sin viajar al servidor | Documento obligatorio, máx. 40 caracteres, formato de email, seleccionar propietario | `clienteValidation.ts`, `vehiculoValidation.ts` |
| **Backend (Spring)** | Seguridad y reglas de negocio | `@NotBlank`/`@Size` en el DTO (→ 400), RN-01 propietario activo (`PropietarioInactivoException` → 409), documento duplicado (`ClienteDuplicadoException` → 409) | Controller + service del backend |
| **Base de datos (PostgreSQL)** | Integridad final, aunque todo lo demás falle | `UNIQUE` en placa y VIN, `FOREIGN KEY` vehiculo → cliente, `NOT NULL` | DDL del esquema `autocare` |

**El frontend NO es frontera de seguridad.** Todo lo que corre en el navegador lo controla el usuario:
puede desactivar JavaScript, modificar el código con DevTools o llamar al backend directamente con Postman.
Por eso el comentario de `clienteValidation.ts:5` dice: "el backend sigue siendo la autoridad final".

**Mostrar errores del servidor aunque el formulario local sea válido**

Ejemplo: escribes un documento que ya existe. Tu validación local no lo sabe (no tiene todos los clientes
del mundo), así que deja enviar. El backend responde **409** con
`{ "message": "Ya existe un cliente con documento ..." }`. Entonces:

1. `apiClient.ts:58-59`: `response.ok` es `false` → `throw await toApiError(response)`.
2. `toApiError` (líneas 22-36) lee el JSON y crea un `ApiError` con ese `message`. Si viene `fieldErrors`
   (400 de validación), los junta en el mensaje.
3. `ClienteForm.tsx:90-91`: el `catch` guarda el mensaje en `apiError`.
4. Línea 132: se muestra en `<div className="form-error">`.

**Repregunta de presión**: *Si React valida una placa como única y dos usuarios envían al mismo tiempo,
¿qué capa resuelve la carrera?*

**La base de datos**, con el constraint `UNIQUE`. Ejemplo: Ana y Luis cargan la lista a la vez; ninguno ve
la placa "ABC123", así que la validación del front de ambos dice "OK". Los dos envían. Incluso el backend
podría hacer "buscar si existe → no existe → insertar" en paralelo y ambos pasar la verificación. Pero
PostgreSQL **solo permite un INSERT** con esa placa; el segundo falla con violación de `UNIQUE`. El backend
convierte esa `DataIntegrityViolationException` en un **409** (lo hace su `GlobalExceptionHandler`) y mi
front muestra el mensaje. Ninguna validación en el navegador puede resolver esto, porque cada navegador no
sabe lo que hace el otro.

---

## PREGUNTA 15 — CRÍTICA
### Explica cómo un componente hijo comunica acciones al padre mediante props callback.

**Idea simple**

El padre le da al hijo un "botón de llamada" (una función). El hijo no sabe qué pasa cuando lo presiona;
solo lo presiona y dice "pasó esto". Eso se llama **inversión de control**: el componente visual **emite
intenciones** y la página **decide los efectos**.

**Ejemplos reales en tu proyecto**

| Callback | Quién lo emite | Qué dice | Quién decide y qué hace |
|---|---|---|---|
| `onEdit(id)` | `ClienteTable.tsx:38` | "Quieren editar el cliente 7" | `ClientesPage.handleEdit` → GET `/clientes/7` |
| `onDelete(cliente)` | `ClienteTable.tsx:41` | "Quieren eliminar a este cliente" | `ClientesPage` → `setPendingDelete` (abre el diálogo) |
| `onConfirm()` | `ConfirmDialog.tsx:31` | "El usuario confirmó" | `ClientesPage.confirmDelete` → DELETE |
| `onCancel()` | `ConfirmDialog.tsx:28` | "El usuario canceló" | `setPendingDelete(null)` |
| `onSaved(cliente, mode)` | `ClienteForm.tsx:84/87` | "Ya se guardó, este es el resultado" | `ClientesPage.handleSaved` → actualiza la lista |
| `onPageChange(n)` | `Pagination.tsx:13/17` | "Quieren ir a la página n" | `setPage` |
| `onChange(texto)` | `SearchInput.tsx:21` | "El texto de búsqueda es este" | `handleSearch` → `setSearch` + página 1 |

**Cómo se declara y cómo viaja**

```tsx
// 1. El hijo declara qué función espera (ClienteTable.tsx:7-8)
onEdit: (id: number) => void;
onDelete: (cliente: Cliente) => void;

// 2. El padre la entrega (ClientesPage.tsx:160-161)
<ClienteTable onEdit={handleEdit} onDelete={setPendingDelete} ... />

// 3. El hijo la ejecuta en un evento (ClienteTable.tsx:41)
<Button onClick={() => onDelete(cliente)}>Eliminar</Button>
```

Nota: `onDelete={setPendingDelete}` pasa directamente la función `setState`. Es válido porque ambas tienen
la misma forma: reciben un `Cliente`.

**Callback vs. llamada HTTP directa**

- Un **callback** es solo una función que el padre pasó; ejecutarla no implica red.
- Una **llamada HTTP** es `clienteService.eliminar(id)` → `fetch` → backend.
- El hijo hace lo primero; el padre decide si hace lo segundo.

**Caso que el profesor puede preguntarte**: `ClienteForm` y `VehiculoForm` **sí** llaman al service
(`ClienteForm.tsx:83, 86`). Esto es el patrón de la Guía 06 (el formulario "crear/editar" guarda y avisa con
`onSaved` pasando el objeto que devolvió el backend). La tabla, en cambio, no llama a ningún service. Si te
preguntan, puedes decir: "una alternativa más pura sería que el form solo emita `onSubmit(payload)` y la
página haga el POST/PUT; así el form sería todavía más fácil de probar".

**Repregunta de presión**: *¿Por qué `ClienteTable` no debería importar `clienteService` solo para
eliminar una fila?*

1. **Responsabilidad**: la tabla dibuja filas. Eliminar implica confirmar, mostrar "Procesando...",
   manejar errores (409 si tiene vehículos), quitar la fila de la lista, cerrar el form si se estaba
   editando y mostrar el mensaje de éxito. Todo eso es coordinación de la página.
2. **Estado**: la lista `clientes` vive en la página (en el hook). La tabla no puede quitar la fila de un
   estado que no es suyo.
3. **Reutilización y pruebas**: la tabla sin service se puede probar pasándole datos falsos, sin backend.
4. **Confirmación**: con el callback, la página pudo insertar el `ConfirmDialog` entre el clic y el DELETE
   sin tocar la tabla.

---

## PREGUNTA 16
### Explica `map()`, `filter()`, `find()` y `key` en el renderizado de listas.

**Idea simple**

Son métodos de los arrays que **crean un resultado nuevo sin modificar el original**:
- `map` → transforma cada elemento en otra cosa (por ejemplo, cada cliente en una fila `<tr>`).
- `filter` → se queda con los que cumplen una condición.
- `find` → devuelve **el primero** que cumple la condición (o `undefined`).

**Dónde los usas**

```tsx
// map: cada cliente → una fila (ClienteTable.tsx:29-30)
{clientes.map((cliente) => (
    <tr key={cliente.id}> ... </tr>
))}

// map: el menú (Sidebar.tsx:23), las opciones del select (VehiculoForm.tsx:150)

// filter: búsqueda (ClientesPage.tsx:114)
const filtered = clientes.filter((cliente) => matchesCliente(cliente, search, estado));

// filter: quitar la fila eliminada (ClientesPage.tsx:90)
setClientes((prev) => prev.filter((item) => item.id !== pendingDelete.id));

// map para reemplazar uno (ClientesPage.tsx:75)
prev.map((item) => item.id === saved.id ? saved : item)

// some (pariente de find): ¿existe un cliente activo con ese id? (vehiculoValidation.ts:30)
clientes.some((cliente) => cliente.id === clienteId && cliente.activo)
```

Para buscar al propietario no uso `find` sino un **`Map`** (`VehiculosPage.tsx:120`):
`clientesById.get(vehiculo.clienteId)`. Hace lo mismo que
`clientes.find(c => c.id === vehiculo.clienteId)`, pero más rápido: `find` recorre el array en cada fila;
`Map.get` va directo (ver P36).

**No mutar el original**: `filter` y `map` devuelven arrays nuevos. Eso es justo lo que React necesita:
cuando haces `setClientes(nuevoArray)`, React compara referencias; como es un array distinto, sabe que debe
volver a dibujar. Si usaras `splice` o `push` sobre el mismo array, la referencia sería la misma y React
podría no actualizar.

**`key`**

React necesita identificar cada elemento de una lista para saber, entre un render y otro, cuál se agregó,
cuál se quitó y cuál se movió. La `key` debe ser:
- **Única** entre hermanos.
- **Estable**: la misma para el mismo dato en todos los renders.
- Representar la **identidad** del dato → el `id` que viene de la base de datos (`key={cliente.id}`).

**Repregunta de presión**: *¿Qué problema aparece al usar el índice como key si eliminas o reordenas
filas?*

El índice describe la **posición**, no **quién** es. Ejemplo: filas `[Ana(0), Luis(1), Pedro(2)]`. Elimino
a Ana → quedan `[Luis(0), Pedro(1)]`. React ve que la key 0 sigue existiendo y piensa "la fila 0 es la
misma, solo cambió su texto", y que "la key 2 desapareció". Consecuencias:
- Si las filas tienen **estado interno** (un input, un checkbox marcado, un foco), ese estado queda pegado a
  la **posición**: el checkbox que tenía marcado Ana ahora aparece marcado en Luis.
- React actualiza más elementos del DOM de lo necesario (peor rendimiento).
- Con filtros y paginación (que cambian el orden constantemente) estos errores serían frecuentes.

---

## PREGUNTA 17
### Diferencia estado fuente y estado derivado. ¿Qué datos NO conviene duplicar en `useState`?

**Idea simple**

- **Estado fuente**: lo que no se puede calcular a partir de otra cosa. Hay que guardarlo.
- **Estado derivado**: lo que se puede **calcular** a partir del estado fuente. No se guarda: se calcula
  en cada render.

Ejemplo de la vida real: guardas tu fecha de nacimiento (fuente); tu edad (derivada) se calcula. Si
guardaras las dos, algún día tu edad estaría desactualizada.

**En `ClientesPage.tsx`**

| Estado fuente (se guarda) | Línea | Estado derivado (se calcula) | Línea |
|---|---|---|---|
| `clientes` (lo que respondió el backend) | 18 (del hook) | `filtered` | 114 |
| `search` (lo que escribió el usuario) | 26 | `visible` (la página actual) | 115 |
| `estado` (filtro elegido) | 27 | `currentPage` (página ajustada) | 115 |
| `page`, `pageSize` | 28-29 | `totalPages` | 115 |

```tsx
// ClientesPage.tsx:113-115 — el comentario lo dice: "No se guardan en estado"
const filtered = clientes.filter((cliente) => matchesCliente(cliente, search, estado));
const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize);
```

**Otros ejemplos derivados en tu código**:
- `isEditing = cliente != null` (`ClienteForm.tsx:33`).
- `loading = vehiculosQuery.loading || clientesQuery.loading` (`VehiculosPage.tsx:36`).
- `clientesById` (`VehiculosPage.tsx:120`).
- Todas las métricas del Dashboard (`DashboardPage.tsx:23-29`), ver P49.

**Lo que NO conviene duplicar en `useState`**: listas filtradas, listas paginadas, totales, contadores,
"¿hay elementos?", el nombre del propietario dentro de cada vehículo, "¿estoy editando?".

**¿Y el rendimiento?** Filtrar unos cientos de elementos en cada render es instantáneo. Si algún día fuera
lento, se usa `useMemo` (que sigue siendo derivado, solo que con caché), no un `useState` duplicado.

**Repregunta de presión**: *Si cambia `clientes` pero olvidas actualizar `clientesFiltrados` guardado en
otro estado, ¿qué bug visual aparece?*

La tabla muestra datos **viejos**. Ejemplo: creas el cliente "Pedro"; `clientes` ahora tiene a Pedro, pero
la tabla dibuja `clientesFiltrados`, que no lo tiene → el mensaje dice "Cliente creado correctamente" pero
Pedro **no aparece**. O eliminas a Ana y sigue apareciendo hasta que escribes algo en el buscador. Son
errores intermitentes y difíciles de encontrar, porque dependen del orden en que el usuario hizo las cosas.
Con estado derivado es **imposible** que pase: en cada render se recalcula desde la fuente.

---

## PREGUNTA 18
### Diseña el render de una pantalla con loading, error, empty y success sin mezclar estados.

**Idea simple**

La pantalla puede estar en una de cuatro situaciones, y debe mostrar **solo una** a la vez:

1. **Loading**: todavía no sé nada → "Cargando clientes...".
2. **Error**: la carga falló → mensaje + botón Reintentar.
3. **Empty**: la carga funcionó y **no hay datos** → "No hay clientes registrados".
4. **Success**: hay datos → la tabla.

**Tu código (`ClientesPage.tsx`) usa "returns tempranos"**

```tsx
if (loading) return <div className="state-card">Cargando clientes...</div>;   // línea 102

if (loadError) {                                                               // línea 104
    return (
        <div className="state-card error">
            <p>{loadError}</p>
            <button type="button" onClick={reload}>Reintentar</button>
        </div>
    );
}

// ... más abajo, línea 149:
{filtered.length === 0 ? (
    <EmptyState title={clientes.length === 0 ? 'No hay clientes registrados' : 'Sin resultados'} ... />
) : (
    <ClienteTable ... />
)}
```

Como cada `return` corta la función, es **imposible** mostrar "Cargando" y "Error" a la vez.

**Dos tipos de "vacío"** (línea 151):
- `clientes.length === 0` → la base no tiene clientes: "Registra el primer cliente con el formulario".
- `clientes.length > 0` pero `filtered.length === 0` → tu búsqueda no coincide: "Sin resultados".

**Dos tipos de error** (separados a propósito):
- `loadError` (del hook): falló la **carga inicial** → reemplaza toda la pantalla, porque sin datos no hay
  nada que mostrar.
- `actionError` (línea 36 y 124): falló una **acción** (DELETE con 409, GET del detalle) → se muestra
  arriba como alerta, pero **la tabla sigue visible** porque los datos siguen siendo válidos.

**Feedback durante operaciones asíncronas**:
- `loadingDetail` → "Cargando detalle..." mientras llega el GET/{id} (línea 126).
- `saving` → el botón dice "Procesando..." y se deshabilita (`Button.tsx:24, 27`).
- `deleting` → el botón Eliminar del diálogo muestra "Procesando..." (`confirming={deleting}`).
- `successMessage` → "Cliente creado correctamente" durante 2.5 segundos (líneas 39-42), con
  `role="status"` para que los lectores de pantalla lo anuncien.

**Repregunta de presión**: *¿Una lista vacía `[]` es necesariamente un error? ¿Cómo la distingues de un GET
que falló?*

**No.** Un `[]` con status **200** es una respuesta **exitosa**: el backend dice "no hay clientes". Un GET
que falló **no produce un array**: produce una excepción. En mi código:
- Éxito con `[]` → `useAsyncList.ts:32` hace `setData([])`, `error` queda `''` → se ve el `EmptyState`.
- Falla → `apiFetch` lanza error → `useAsyncList.ts:35` hace `setError(mensaje)` → se ve el mensaje de error
  con "Reintentar".
Son dos caminos de código distintos (`try` vs. `catch`), por eso nunca se confunden. Lo que sería un error
de diseño es inicializar en `[]` y **no** tener `loading`: durante la carga se vería "No hay clientes" por
un instante, lo cual es falso. Por eso `loading` empieza en `true` (`useAsyncList.ts:15`).

---

## PREGUNTA 19
### Explica el orden correcto: datos → búsqueda/filtros → paginación → tabla.

**Idea simple**

Primero decides **qué** se puede mostrar (filtrar), después decides **cuánto** se muestra a la vez
(paginar). Es como buscar en una biblioteca: primero eliges los libros de "historia" y después los pones
de 10 en 10 en la mesa. Si pusieras 10 libros cualquiera en la mesa y después buscaras "historia" solo
entre esos 10, te perderías los demás.

**Tu código** (`VehiculosPage.tsx:120-124`, igual en `ClientesPage.tsx:114-115`)

```tsx
const clientesById = new Map(...);                                       // 0. índice de apoyo
const filtered = vehiculos.filter((v) => matchesVehiculo(v, {...}, clientesById));  // 1. filtrar
const { items: visible, page: currentPage, totalPages } = paginate(filtered, page, pageSize); // 2. paginar
// 3. <VehiculoTable vehiculos={visible} />  y  <Pagination page={currentPage} totalPages={totalPages} />
```

**La función `paginate`** (`shared/utils/paginate.ts:12-22`)

```ts
const totalPages = Math.max(1, Math.ceil(data.length / pageSize));   // total de páginas (mínimo 1)
const currentPage = Math.min(Math.max(1, page), totalPages);         // ajusta la página al rango válido
const start = (currentPage - 1) * pageSize;                          // dónde empieza el corte
return { items: data.slice(start, start + pageSize), page: currentPage, totalPages };
```

Vocabulario:
- **`pageSize`**: cuántos por página (5, 10 o 20; lo elige el usuario en `PAGE_SIZE_OPTIONS`).
- **`totalItems`**: cuántos quedaron después de filtrar → `filtered.length`.
- **`totalPages`**: `Math.ceil(totalItems / pageSize)`. Ejemplo: 12 ítems de 5 en 5 → 3 páginas.
- **`slice(start, end)`**: corta el array sin modificarlo. Página 2 de 5 → `slice(5, 10)`.

**Reajustar la página**

Dos mecanismos:
1. Al cambiar búsqueda/filtro/tamaño, **vuelvo a la página 1 desde el propio evento**
   (`handleSearch`, `handleEstado`, `handlePageSize` en `ClientesPage.tsx:45-56`). Lo hago en el handler
   y no con un `useEffect` porque así se actualiza todo en el mismo render, sin un render intermedio con la
   página equivocada.
2. Si la página queda fuera de rango por otra causa (por ejemplo, eliminé el único elemento de la última
   página), `paginate` la ajusta a la última válida (`Math.min(...)`, línea 14). Lo prueba el test
   `paginate.test.ts:17-22`.

**Repregunta de presión**: *¿Qué error funcional aparece si paginas primero y luego buscas?*

Solo buscarías **dentro de la página actual**. Ejemplo: 30 clientes, 10 por página, estás en la página 1 y
buscas "Pedro", que está en la página 3 → el resultado dice "Sin resultados" aunque Pedro existe. Además el
contador "Página 1 de 3" sería falso (contaría todas las páginas, no las del resultado), y podrías ver
páginas con 2 elementos y otras con 0.

---

## PREGUNTA 20
### Explica Modal/ConfirmDialog y por qué reemplazar `window.confirm` mejora el diseño.

**Idea simple**

`window.confirm('¿Seguro?')` es la ventanita gris del navegador. Funciona, pero no puedes darle estilo,
**congela toda la página** mientras está abierta y no puede mostrar "Procesando...". Un `ConfirmDialog`
propio es un componente React: lo controlas con estado y se ve como el resto de tu app.

**Dos piezas en tu proyecto**

1. **`components/ui/Modal.tsx`** — la "ventana" genérica:
   ```tsx
   const ref = useRef<HTMLDialogElement>(null);               // línea 16: acceso al <dialog> real
   useEffect(() => {                                          // líneas 19-24
       const dialog = ref.current;
       if (!dialog) return;
       if (open && !dialog.open) dialog.showModal();          // abrir
       if (!open && dialog.open) dialog.close();              // cerrar
   }, [open]);
   <dialog ref={ref} onClose={onClose} aria-labelledby="modal-title">   // línea 27
   ```
   Usa el elemento HTML nativo `<dialog>`. `showModal()` le da gratis: capa superior, fondo bloqueado,
   **cierre con Escape**, foco dentro del diálogo y semántica de diálogo para lectores de pantalla.
   El `useEffect` es necesario porque `showModal()` es una API del navegador (sistema externo a React):
   el Effect **sincroniza** la prop `open` con esa API.

2. **`components/ui/ConfirmDialog.tsx`** — usa `Modal` y agrega mensaje + botones Cancelar/Eliminar.

**Las tres partes que debes distinguir**

| Parte | En tu código |
|---|---|
| **Estado open/close** | Lo decide la página: `open={pendingDelete !== null}` (`ClientesPage.tsx:168`) |
| **Contenido** | `title`, `message` (con el nombre del cliente) |
| **Callbacks** | `onConfirm={confirmDelete}`, `onCancel={() => setPendingDelete(null)}` |

**Flujo de eliminar en dos pasos**
1. Clic en "Eliminar" en la tabla → `onDelete(cliente)` → `setPendingDelete(cliente)` → el diálogo se abre.
   **Todavía no hay ningún request.**
2. Clic en "Eliminar" del diálogo → `confirmDelete()` → DELETE al backend.

**El modal no ejecuta reglas de negocio**: `ConfirmDialog` no sabe qué está borrando ni llama a ningún
service (comentario de la línea 14). Solo dice "confirmaron" o "cancelaron". El mismo componente sirve
para Clientes, Vehículos y Servicios.

**Accesibilidad**:
- `aria-labelledby="modal-title"` → el lector de pantalla anuncia el título al abrir.
- Botón cerrar con `aria-label="Cerrar"` (línea 30), porque el símbolo "×" solo no se entiende.
- Mientras borra, Cancelar se deshabilita (`disabled={confirming}`) para no cerrar a mitad del request.
- Mejora posible: el id `modal-title` es fijo; si hubiera dos modales abiertos a la vez se repetiría.
  Se podría generar con `useId()` de React.

**Repregunta de presión**: *Si el usuario cierra el modal de DELETE, ¿qué estados deben quedar intactos y
qué request NO debe ocurrir?*

- Cerrar (botón Cancelar, la "×" o la tecla Escape, que dispara el evento `onClose` del `<dialog>`) llama
  a `onCancel` → `setPendingDelete(null)`.
- **No ocurre ningún DELETE**: `clienteService.eliminar` solo se llama dentro de `confirmDelete`.
- **Quedan intactos**: la lista `clientes` (la fila sigue ahí), la búsqueda, el filtro, la página actual y
  el cliente que se estuviera editando en el formulario. Solo cambia `pendingDelete`.
