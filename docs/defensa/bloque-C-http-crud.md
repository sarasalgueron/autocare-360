# Bloque C — HTTP, Services y CRUD Fullstack (preguntas 21–32)

[← Volver al índice](README.md)

> Para estas preguntas ten abiertos: `ClientesPage.tsx`, `ClienteForm.tsx`, `clienteService.ts`,
> `apiClient.ts` y en el navegador **DevTools (F12) → pestaña Network**. El profesor puede pedirte que
> muestres la petición real.

---

## PREGUNTA 21 — CRÍTICA
### Explica el flujo completo de un GET desde React hasta Spring Boot y de regreso a la pantalla.

**Idea simple**

Es como pedir comida a domicilio: haces el pedido (request), esperas sin quedarte paralizado (asincronía),
llega el repartidor con la bolsa (response), abres la bolsa (parsear JSON), sirves la comida en la mesa
(setState) y la familia la ve (re-render).

**El recorrido completo: GET de clientes al entrar a `/clientes`**

| # | Qué pasa | Dónde | ¿De quién es? |
|---|---|---|---|
| 1 | Se monta `ClientesPage` y llama a `useClientes()` | `ClientesPage.tsx:17-23` | Tu código |
| 2 | `useClientes` llama a `useAsyncList(clienteService.listar)` | `useClientes.ts:7` | Tu código |
| 3 | El `useEffect` crea un `AbortController` y ejecuta `load()` | `useAsyncList.ts:24-42` | Tu código + React |
| 4 | `setLoading(true)` → la página muestra "Cargando clientes..." | `useAsyncList.ts:29` | Tu código |
| 5 | `loader(controller.signal)` = `clienteService.listar(signal)` | `useAsyncList.ts:31` | Tu código |
| 6 | El service llama a `apiFetch<Cliente[]>('/clientes', { signal })` | `clienteService.ts:10` | Tu código |
| 7 | `apiFetch` arma headers (`X-Usuario-Id`) y la URL `http://localhost:9090/api/clientes` | `apiClient.ts:46-53` | Tu código |
| 8 | `fetch(url, ...)` envía la petición HTTP | `apiClient.ts:53` | **Web API del navegador** |
| 9 | El navegador revisa CORS, envía `GET /api/clientes` | — | Navegador |
| 10 | Spring: CORS OK → `ClienteController` → service → repository → `SELECT` en PostgreSQL | backend | **Backend externo** |
| 11 | Responde `200 OK` + body `[{"id":1,"documento":"7845123",...}]` | backend | Backend |
| 12 | `fetch` resuelve la Promise con un objeto `Response` | `apiClient.ts:53` | Navegador |
| 13 | `if (!response.ok)` → es 200, sigue | `apiClient.ts:58` | Tu código |
| 14 | `response.json()` → convierte el texto JSON en **objetos JavaScript** | `apiClient.ts:66` | Navegador |
| 15 | `setData(result)` guarda el array en el estado | `useAsyncList.ts:32` | Tu código → React |
| 16 | `finally`: `setLoading(false)` | `useAsyncList.ts:38` | Tu código |
| 17 | React **re-renderiza** `ClientesPage`: `loading` es false, filtra, pagina y dibuja la tabla | `ClientesPage.tsx:114-163` | React |

**Código propio vs. Web API vs. backend**
- **Tu código**: página, hook, service, `apiFetch`.
- **Web API** (lo da el navegador, no React): `fetch`, `Response`, `response.json()`, `AbortController`.
- **Backend externo**: todo lo que pasa en Spring Boot y PostgreSQL. Tu frontend solo ve el status y el JSON.

**Cómo demostrarlo en Network**: F12 → Network → filtro "Fetch/XHR" → recarga `/clientes`. Verás la fila
`clientes` con Method `GET`, Status `200`. En "Headers" ves la URL y `X-Usuario-Id: 2`; en "Response" ves el
JSON. (Puede que veas la petición **dos veces**: eso es StrictMode en desarrollo, ver P40.)

**Repregunta de presión**: *¿En qué punto exacto se convierte la respuesta HTTP en un objeto JavaScript y en
qué punto React decide volver a renderizar?*

- **Conversión**: en `response.json()` (`apiClient.ts:66`). Antes de eso, la respuesta es texto/bytes dentro
  de un objeto `Response`. `json()` lee el cuerpo y hace el equivalente a `JSON.parse`, devolviendo una
  Promise con el array de objetos.
- **Re-render**: cuando se llama a **`setData(result)`** (`useAsyncList.ts:32`). Llamar a un `setState` con
  un valor nuevo le dice a React "este componente cambió". React agenda un nuevo render de `ClientesPage`
  (el componente que usa el hook), y en ese render la tabla recibe los datos.

---

## PREGUNTA 22
### ¿Por qué `fetch()` no considera automáticamente un 404 o 500 como rechazo de la Promise?

**Idea simple**

Para `fetch`, su trabajo es **llevar y traer el mensaje**. Si el servidor contestó (aunque sea "no
encontrado" o "me caí"), `fetch` cumplió: hubo comunicación. La Promise solo se **rechaza** cuando **no hubo
respuesta**: sin red, servidor apagado, CORS bloqueado o petición abortada.

**Dos tipos de error totalmente distintos**

| Situación | ¿Qué hace `fetch`? | Ejemplo |
|---|---|---|
| **Error de red** | **Rechaza** la Promise (`TypeError: Failed to fetch`) | Backend apagado, CORS bloqueado, sin internet |
| **Respuesta HTTP con error** | **Resuelve** la Promise con `response.ok = false` | 400, 404, 409, 500 |
| **Abortado** | Rechaza con `DOMException` nombre `AbortError` | Saliste de la página antes de que respondiera |

`response.ok` es `true` solo si el status está entre **200 y 299**.

**Cómo lo unifica tu `apiClient.ts`**

```ts
const response = await fetch(`${API_URL}${endpoint}`, {...});   // línea 53: si es error de red, lanza aquí

if (!response.ok) {                                               // línea 58: revisión manual
    throw await toApiError(response);                             // convierte 4xx/5xx en excepción
}
```

`toApiError` (líneas 22-36):
1. Lee el cuerpo como texto.
2. Intenta parsearlo como el JSON de error del backend (`{ message, fieldErrors }`).
3. Si hay `fieldErrors` (400 de validación), los agrega al mensaje.
4. Si no era JSON (por ejemplo, una página HTML de un proxy), usa el texto o `statusText`.
5. Devuelve un `ApiError` con `status`, `message` y `fieldErrors`.

Resultado: **para todos los que usan `apiFetch`, cualquier fallo (red o HTTP) llega como excepción al
`catch`**. Las páginas no tienen que acordarse de revisar `response.ok`: lo hace un solo lugar.

**Repregunta de presión**: *Si el servidor responde 500 con JSON, ¿entrarías directamente al catch sin
revisar `response.ok`?*

**No.** Sin la revisión, `fetch` resuelve normalmente, el código sigue y `response.json()` parsea el JSON de
error (`{"message":"Error interno"}`) como si fueran **datos válidos**. Se guardaría ese objeto en el
estado como si fuera un `Cliente[]`, y la página fallaría al hacer `.filter` sobre un objeto que no es
array, o mostraría basura. **Fingiría éxito.** Por eso el `if (!response.ok) throw` es obligatorio: es lo
que convierte un 500 en un error que llega al `catch`.

---

## PREGUNTA 23 — CRÍTICA
### ¿Qué es CORS y por qué Postman/Swagger pueden funcionar mientras React falla en el navegador?

**Idea simple**

CORS es una **regla de seguridad del navegador**. Por defecto, el navegador no deja que el JavaScript de
una página lea respuestas de **otro origen**, a menos que ese otro servidor diga explícitamente "a esta
página sí le permito". Es para evitar que una página maliciosa use tu sesión para leer datos de otro sitio.

**¿Qué es un "origen"?** La combinación de **esquema + host + puerto**:

| URL | Origen |
|---|---|
| `http://localhost:5173` (tu frontend, Vite) | `http` + `localhost` + `5173` |
| `http://localhost:9090` (tu backend) | `http` + `localhost` + `9090` |

Mismo host, **distinto puerto → distinto origen**. Por eso necesitas CORS aunque todo esté en tu PC.

**Cómo funciona**

1. Tu JavaScript (en `:5173`) hace `fetch('http://localhost:9090/api/clientes')`.
2. El navegador agrega el header `Origin: http://localhost:5173`.
3. Para peticiones "no simples" (por ejemplo, con `Content-Type: application/json` o con un header propio
   como tu `X-Usuario-Id`), el navegador primero envía una petición **preflight** `OPTIONS` preguntando
   "¿me dejas?".
4. El backend responde con `Access-Control-Allow-Origin: http://localhost:5173` (y los métodos/headers
   permitidos).
5. Si el header no está o no coincide, el navegador **bloquea** la respuesta: tu código recibe
   `TypeError: Failed to fetch` y en consola aparece "blocked by CORS policy".

**En tu backend** (`autocare-360`): `shared/web/CorsConfig.java` hace
`registry.addMapping("/api/**").allowedOrigins(...)` y en `application.properties`:
`app.cors.allowed-origins=http://localhost:5173`.

**¿Por qué Postman y Swagger funcionan?**
- **Postman** no es un navegador: no aplica CORS. Envía la petición y muestra lo que llegue.
- **Swagger UI** se sirve **desde el mismo backend** (`localhost:9090/swagger-ui`), así que es **mismo
  origen**: no hay CORS que revisar.
- CORS no protege al servidor (la petición puede llegar igual); protege al **usuario del navegador**.

**Repregunta de presión**: *Si el backend responde bien en Postman pero el navegador bloquea la llamada,
¿cuál es tu primera hipótesis y cómo la confirmas?*

> (El banco menciona `npm run backend:check`; ese script no existe en tu proyecto. La idea es la misma:
> "el backend responde desde fuera del navegador".)

**Hipótesis**: el backend no está permitiendo el origen del frontend (CORS mal configurado: falta
`http://localhost:5173`, se escribió `127.0.0.1` en lugar de `localhost`, o el frontend corre en otro puerto
como 5174).

**Cómo lo confirmo**:
1. **Consola**: mensaje rojo "Access to fetch at '...' from origin 'http://localhost:5173' has been blocked
   by CORS policy".
2. **Network**: la petición aparece con estado "CORS error", o veo una `OPTIONS` (preflight) fallida, y en
   la respuesta **falta** el header `Access-Control-Allow-Origin`.
3. **Backend**: reviso `app.cors.allowed-origins` y que el mapping cubra `/api/**`.
4. Reviso que la URL del front (barra de direcciones) coincida exactamente con el origen permitido.

---

## PREGUNTA 24
### Defiende la separación entre apiClient, services, hooks y componentes.

**Idea simple**

Cada capa responde **una sola pregunta**:

| Capa | Archivo | Pregunta que responde |
|---|---|---|
| **apiClient** | `api/apiClient.ts` | ¿**Cómo** se habla HTTP? (URL base, headers, JSON, errores, 204) |
| **service** | `features/clientes/services/clienteService.ts` | ¿**Qué** operaciones hay sobre clientes y en qué ruta? (`listar` = GET `/clientes`) |
| **hook** | `shared/hooks/useAsyncList.ts`, `features/clientes/hooks/useClientes.ts` | ¿**Cuándo** se carga y en qué estado está? (data, loading, error, reload, cancelación) |
| **componente / página** | `ClientesPage.tsx`, `ClienteTable.tsx` | ¿**Qué se ve** y qué hace el usuario? |

**Ejemplo de cada responsabilidad**
- Solo `apiClient.ts` conoce `API_URL`, `Content-Type`, `X-Usuario-Id`, `response.ok` y el 204.
- Solo `clienteService.ts` conoce la cadena `'/clientes'`.
- Solo `useAsyncList` sabe de `AbortController` y del `reloadToken`.
- `ClienteTable` no sabe nada de HTTP.

**Cómo facilita cambios** (ejemplos reales que ya pasaron en tu proyecto):
- Agregar el header `X-Usuario-Id` para la sesión demo: **una línea** en `apiClient.ts:51` y todas las
  peticiones de todas las features lo enviaron.
- Cuando exista login: se reemplaza `sesionDemo.ts` por un token y se cambia `apiClient`; ni services ni
  páginas cambian.
- Si el backend cambia `/clientes` por `/customers`: solo `clienteService.ts`.

**Cómo facilita pruebas**:
- `paginate`, `matchesCliente` y `validarCliente` son funciones puras → se prueban sin React ni backend
  (`paginate.test.ts`, `clienteFilters.test.ts`, `clienteValidation.test.ts`).
- `Pagination` y `SearchInput` no conocen el backend → se prueban con datos falsos.
- Se podría simular (mockear) `clienteService` para probar una página sin servidor.

**Repregunta de presión**: *Si cambias fetch por Axios, ¿qué capas deberían cambiar y cuáles no?*

**Idealmente solo `apiClient.ts`.** Dentro de `apiFetch` cambiarías `fetch` por `axios.request`, y
adaptarías el manejo de errores (Axios sí rechaza la Promise con 4xx/5xx) para seguir lanzando el mismo
`ApiError`. Como `apiFetch` mantiene la misma firma (`apiFetch<T>(endpoint, options): Promise<T>`):
- **Services**: no cambian (o casi nada; quizá cómo se pasa el `signal`).
- **Hooks**: no cambian.
- **Componentes y páginas**: no cambian.
Si en cambio cada componente hiciera `fetch` directo, tendrías que modificar todos.

---

## PREGUNTA 25 — CRÍTICA
### POST Cliente: explica línea por línea desde Guardar hasta que la nueva fila aparece en la tabla.

**Recorrido completo** (archivo principal: `ClienteForm.tsx`)

**1. El usuario presiona "Crear cliente"** (botón `type="submit"`, línea 140) → el `<form>` dispara
`onSubmit` → `handleSubmit(e)` (línea 62).

**2. Cancelar la recarga y limpiar el error anterior**
```ts
e.preventDefault();          // línea 63: sin recargar la página
setApiError('');             // línea 64
```

**3. Validación local**
```ts
const validationErrors = validarCliente(formData);              // línea 66
setErrors(validationErrors);                                    // línea 67: muestra mensajes bajo cada input
if (Object.keys(validationErrors).length > 0) return;          // línea 68: si hay errores, NO se envía
```

**4. Construir el payload** (líneas 71-77): de `ClienteFormData` (lo escrito) a `ClienteCreateRequest`
(lo que espera el backend):
- `trim()` quita espacios sobrantes.
- Email en minúsculas; si está vacío → `null`.
- Teléfono vacío → `null` (columna NULL en PostgreSQL).

**5. Marcar que se está guardando**
```ts
setSaving(true);             // línea 80
```
El botón recibe `loading={saving}` → muestra "Procesando..." y se **deshabilita**
(`Button.tsx:24`: `disabled={disabled || loading}`). Esto evita el **doble clic** que crearía dos clientes.

**6. Llamar al service** (`cliente` es null, estamos creando):
```ts
const creado = await clienteService.crear(payload);     // línea 86
```
→ `clienteService.ts:17-22`:
```ts
return apiFetch<Cliente>('/clientes', { method: 'POST', body: JSON.stringify(data) });
```
`JSON.stringify` convierte el objeto en texto JSON.

**7. `apiFetch`** (`apiClient.ts`):
- Línea 47-49: como hay `body`, agrega `Content-Type: application/json` (para que Spring sepa que es JSON).
- Línea 51: agrega `X-Usuario-Id`.
- Línea 53: `fetch('http://localhost:9090/api/clientes', { method: 'POST', headers, body })`.

**8. Backend**: `@PostMapping` → `@Valid ClienteRequest` → service (revisa documento duplicado) →
`INSERT` en PostgreSQL → la base genera el `id` → responde **`201 Created`** con el cliente creado
(incluido su `id`).

**9. Respuesta**: `response.ok` es true (201) → `response.json()` → objeto `Cliente` **con id**.

**10. Avisar al padre y limpiar**
```ts
onSaved(creado, 'create');                 // línea 87
setFormData(initialClienteForm);           // línea 88: vacía el formulario
```

**11. La página actualiza la lista** (`ClientesPage.tsx:71-80`):
```ts
setClientes((prev) => [...prev, saved]);   // array NUEVO con el cliente agregado al final
setEditingCliente(null);
showSuccess('Cliente creado correctamente');
```

**12. `finally`**: `setSaving(false)` (línea 93) → el botón vuelve a estar activo.

**13. Re-render**: `clientes` cambió → se recalcula `filtered` y `visible` → la nueva fila aparece en la tabla
(si cumple la búsqueda/filtro actual y cae en la página visible).

**Si falla** (por ejemplo 409 documento duplicado): `apiFetch` lanza `ApiError` → `catch` (línea 90) →
`setApiError(mensaje)` → se ve el mensaje rojo bajo el formulario. **La tabla no cambia** y lo escrito **no
se borra**, para que el usuario pueda corregir.

**Crear localmente vs. persistir**: yo **no** agrego a la tabla el objeto que armé en el formulario
(`payload`, que no tiene `id`). Agrego el objeto **que devolvió el backend** (`creado`), que tiene el `id`
real generado por PostgreSQL. Si agregara el payload: no tendría `id` (la `key` sería `undefined`), Editar y
Eliminar no funcionarían, y si el backend hubiera fallado, mostraría un cliente que no existe.

**Repregunta de presión**: *Si el backend devuelve 201 pero tu tabla no cambia, ¿qué revisarías y en qué
orden?*

1. **Network → Response**: ¿el body trae el cliente creado con `id`? (Si el backend devuelve vacío, `saved`
   sería raro.)
2. **¿Se llamó a `onSaved`?** Breakpoint o `console.log` en `ClienteForm.tsx:87`. ¿El `await` terminó sin
   lanzar error?
3. **¿`ClientesPage` pasa `onSaved={handleSaved}`?** (línea 130).
4. **¿`handleSaved` crea un array nuevo?** `[...prev, saved]`. Si alguien lo cambiara por
   `prev.push(saved); return prev;`, React no vería cambio.
5. **¿La fila está oculta por la vista?** Quizá hay una búsqueda o filtro activo que no la incluye, o el
   nuevo cliente quedó al final en otra **página** (se agrega al final del array). Limpio el buscador y voy
   a la última página.
6. Con **React DevTools** reviso el estado del hook: ¿tiene el nuevo cliente?

---

## PREGUNTA 26
### GET/{id}: explica cómo seleccionas un Cliente para editar y por qué podrías volver a consultarlo.

**Recorrido**

1. Clic en "Editar" → `ClienteTable.tsx:38`: `onEdit(cliente.id)` (solo envía el **id**).
2. `ClientesPage.tsx:58-69` `handleEdit(id)`:
   ```ts
   setLoadingDetail(true);                                    // "Cargando detalle..."
   const cliente = await clienteService.obtenerPorId(id);     // GET /clientes/7
   setEditingCliente(cliente);                                // guarda la selección
   ```
3. `clienteService.ts:13-15`: `apiFetch<Cliente>(\`/clientes/${id}\`)`.
4. Re-render: `editingCliente` baja como prop `cliente` a `ClienteForm` (línea 129).
5. `ClienteForm.tsx:36-51`: el `useEffect` ve que `cliente` cambió y **precarga** el formulario
   (`setFormData({...})`), convirtiendo `null` → `''` en email y teléfono.
6. `isEditing` pasa a `true` → el título dice "Editar cliente #7" y aparece "Cancelar edicion".

**Cancelar la edición**: `onCancelEdit={() => setEditingCliente(null)}` (línea 131). El Effect del form ve
`cliente = null` y vuelve a `initialClienteForm`, limpiando errores. También se limpia
`editingCliente` después de guardar (`handleSaved`) y si se elimina el cliente que se estaba editando
(línea 91).

**¿Por qué volver a consultar si ya tengo el cliente en la tabla?**

| Usar el objeto de la tabla | Volver a pedir GET/{id} (lo que hago) |
|---|---|
| Instantáneo, sin petición | Una petición extra (pequeña) |
| Puede estar **desactualizado** (lo cargué hace 20 minutos) | Trae la versión **actual** del servidor |
| Solo tiene los campos que trae el listado | Si el backend tuviera un DTO de detalle con más campos, lo tendría |
| Si alguien lo borró, no me entero hasta guardar | Si alguien lo borró, recibo **404** de inmediato y lo muestro en `actionError` |

Lo hago así porque la Guía 06 pide practicar GET/{id} y porque es más seguro. Usar el dato local sería
razonable si la lista es fresca y el listado ya trae todos los campos.

**Repregunta de presión**: *¿Qué pasa si el registro cambió en el servidor desde que cargaste la lista y
editas una copia vieja?*

Si edito la copia vieja y envío un PUT, el PUT **reemplaza todo** el registro con mis datos → **piso los
cambios del otro usuario** sin saberlo (problema de "lost update", última escritura gana). Ejemplo: otro
usuario cambió el teléfono; yo cambio solo el email partiendo de la copia vieja; mi PUT envía el teléfono
viejo y deshace su cambio.
- El GET/{id} **reduce** el riesgo (parto de la versión actual en el momento de editar).
- No lo elimina del todo (alguien puede cambiarlo mientras yo edito). La solución completa es del backend:
  **bloqueo optimista** con un campo `version` (`@Version` en JPA) que responde **409** si la versión que
  envío ya no es la actual.

---

## PREGUNTA 27 — CRÍTICA
### PUT: explica la actualización completa y por qué el mismo formulario sirve para Crear y Editar.

**Un formulario, dos modos**

El modo se decide por la **presencia de la entidad**: `const isEditing = cliente != null;`
(`ClienteForm.tsx:33`).

| | Crear | Editar |
|---|---|---|
| Prop `cliente` | `null` | El `Cliente` traído con GET/{id} |
| Formulario | Vacío (`initialClienteForm`) | Precargado por el `useEffect` |
| Título / botón | "Nuevo cliente" / "Crear cliente" | "Editar cliente #7" / "Actualizar cliente" |
| Petición | `POST /clientes` | `PUT /clientes/7` |
| Después de éxito | Vacía el form; `[...prev, saved]` | `prev.map(...)` reemplaza la fila |

**¿Por qué un solo formulario?** Los campos, la validación y la construcción del payload son **idénticos**.
Con dos formularios duplicarías todo eso, y al agregar un campo tendrías que acordarte de los dos.

**Recorrido del PUT**
1. Validación igual que al crear (líneas 66-68).
2. Payload igual (líneas 71-77). En tu proyecto `ClienteUpdateRequest = Omit<Cliente, 'id'>`
   (`ClienteRequests.ts:4`): mismos campos que crear. El `id` **no va en el body**, va en la **URL**.
3. Línea 82-84:
   ```ts
   if (cliente) {
       const actualizado = await clienteService.actualizar(cliente.id, payload);
       onSaved(actualizado, 'edit');
   }
   ```
4. `clienteService.ts:24-29`: `apiFetch(\`/clientes/${id}\`, { method: 'PUT', body: JSON.stringify(data) })`.
5. Backend: busca el 7 (si no existe → 404), valida, actualiza, responde **200** con el cliente actualizado.
6. `ClientesPage.tsx:75`: reemplazo solo esa fila:
   ```ts
   prev.map((item) => item.id === saved.id ? saved : item)
   ```
   Recorre todos; si el id coincide pone la versión **del servidor**, si no, deja el original. Crea un array
   nuevo y la fila conserva su posición.
7. `setEditingCliente(null)` → el formulario vuelve a modo crear.

**PUT es "reemplazo completo"**: envío **todos** los campos, no solo el que cambié. Por eso uso el formulario
completo. (Para cambios parciales existe `PATCH`.)

**Idempotencia**: una operación es idempotente si hacerla **una o varias veces** deja el **mismo estado
final**. PUT lo es: "deja el cliente 7 con estos datos" da igual repetirlo. POST **no** lo es: cada POST
crea un cliente nuevo.

**Repregunta de presión**: *Si presionas Guardar dos veces con exactamente el mismo PUT, ¿qué estado final
debería quedar?*

El **mismo** que con un solo PUT: el cliente 7 con esos datos. La segunda petición escribe los mismos
valores encima. En la tabla, el `map` reemplaza la fila dos veces con el mismo objeto → no se duplica nada.
(En la práctica tampoco puede pasar fácil: el botón se deshabilita con `saving`.) Con **POST** dos clics sí
serían peligrosos: dos clientes (o un 409 por documento duplicado en el segundo). Por eso deshabilitar el
botón es más importante en crear.

---

## PREGUNTA 28 — CRÍTICA
### DELETE: explica confirmación, request, 204 No Content y sincronización de la tabla.

**Recorrido** (`ClientesPage.tsx`)

1. **Intención**: clic en "Eliminar" → `onDelete(cliente)` → `setPendingDelete(cliente)` (línea 161).
   No hay request todavía.
2. **Confirmación**: `ConfirmDialog` se abre porque `open={pendingDelete !== null}` (línea 168), con el
   mensaje "¿Eliminar a Ana Rojas? Esta accion no se puede deshacer."
3. **Confirmar** → `confirmDelete()` (líneas 83-100):
   ```ts
   if (!pendingDelete) return;                                    // protección
   setDeleting(true);                                             // botón "Procesando...", Cancelar deshabilitado
   setActionError('');
   await clienteService.eliminar(pendingDelete.id);               // DELETE /clientes/7
   setClientes((prev) => prev.filter((item) => item.id !== pendingDelete.id));  // SOLO si no lanzó error
   if (editingCliente?.id === pendingDelete.id) setEditingCliente(null);       // si lo estaba editando
   showSuccess('Cliente eliminado correctamente');
   ```
   `catch`: `setActionError(mensaje)` — **la fila NO se quita**.
   `finally`: `setDeleting(false)` y `setPendingDelete(null)` (cierra el diálogo pase lo que pase).

4. **Service**: `clienteService.ts:31-35` → `apiFetch<void>(..., { method: 'DELETE' })`.

**Bloquear solo la acción necesaria**: `deleting` deshabilita los botones **del diálogo**; el resto de la
pantalla sigue usable. (El banco menciona `deletingId`, que serviría para deshabilitar solo el botón de
**esa fila** si no hubiera diálogo; con el diálogo modal, el fondo ya está bloqueado.)

**204 No Content**

El backend responde `204` cuando borra: significa "éxito, y no tengo nada que devolverte". **No hay body.**
Si llamaras a `response.json()` sobre un cuerpo vacío, lanzaría `SyntaxError: Unexpected end of JSON input`
y tu código pensaría que el DELETE falló (¡aunque sí se borró!). Por eso `apiClient.ts:62-64`:
```ts
if (response.status === 204) {
    return undefined as T;
}
```

**Repregunta de presión**: *Si el backend responde 409 porque el Cliente tiene Vehículos, ¿por qué sería
incorrecto hacer `filter()` y ocultarlo igualmente?*

Porque **el cliente sigue existiendo en la base de datos**. La FK `vehiculo.cliente_id → cliente.id` impidió
borrarlo (en tu proyecto el DELETE es físico, y PostgreSQL rechaza borrar un padre con hijos). Si lo
ocultara:
- La pantalla **mentiría**: el usuario cree que lo borró.
- Al recargar la página, el cliente "resucita" → confusión.
- El usuario no se entera de que primero debe borrar o reasignar los vehículos.
- Rompe la regla del proyecto: **"la UI cambia solo después de una respuesta exitosa del backend"**.
Por eso el `filter` está **después** del `await`: si el `await` lanza el 409, la ejecución salta al `catch`
y nunca llega al `filter`.

---

## PREGUNTA 29
### Explica cómo interpreta el frontend 400, 404, 409 y 500 con ejemplos reales.

**Idea simple**: el status es un **código** que dice qué tipo de problema hubo. Los 4xx son "el problema es
tu petición"; los 5xx son "el problema es mío (del servidor)".

| Status | Significado | Ejemplo real en AutoCare360 | Qué hace el backend |
|---|---|---|---|
| **400 Bad Request** | Datos con forma inválida | Enviar `documento: ""` o un email mal formado saltándose el front (Postman) | `MethodArgumentNotValidException` → 400 "Datos invalidos" + `fieldErrors` |
| **404 Not Found** | El recurso o la ruta no existe | `GET /clientes/999` (id que no existe), o editar un cliente que otro usuario borró | `ClienteNoEncontradoException` → 404 |
| **409 Conflict** | Los datos están bien formados pero chocan con una regla o con el estado actual | Documento duplicado, placa o VIN duplicado, propietario inactivo (RN-01), borrar cliente con vehículos, abrir una segunda orden activa para el mismo vehículo (RN-03), transición de estado no permitida | Excepciones que heredan de `ConflictoNegocioException`, o `DataIntegrityViolationException` → 409 |
| **500 Internal Server Error** | Falla inesperada del servidor | Base de datos caída, un bug (NullPointerException) | Mensaje genérico |

**Cómo los trata tu frontend**

Todos pasan por el mismo camino: `apiFetch` → `toApiError` → `ApiError` con el `message` del backend → el
`catch` de la página o del formulario lo muestra. Así el usuario ve **el mensaje real** ("Ya existe un
cliente con documento 7845123"), no un genérico. Para el 400, `toApiError` (líneas 27-30) junta los
`fieldErrors` en el mensaje: "Datos invalidos: El documento es obligatorio."

`ApiError` guarda también el `status` (línea 11), así que si quisiera tratar un caso distinto podría
preguntar `if (err instanceof ApiError && err.status === 404)`.

**Nunca se finge éxito**: en todos los casos el `throw` salta el código de éxito (agregar a la lista,
mostrar "creado correctamente").

**No todo es "No hay internet"**: el error de **red** es distinto. Si el backend está apagado, `fetch`
lanza `TypeError: Failed to fetch` (sin status). Solo ese caso significa "no se pudo conectar". Un 409
significa que el servidor **sí** respondió y rechazó la operación por una razón concreta.

**Repregunta de presión**: *Dame un ejemplo donde 409 sea más correcto que 400.*

**Registrar un vehículo con una placa que ya existe.** El JSON está perfecto: todos los campos presentes,
con el formato y largo correctos → no es un 400. El problema es que **choca con el estado actual** de la base
(ya hay otro vehículo con esa placa). Mismo caso: **asignar un vehículo a un cliente inactivo** (RN-01):
`clienteId: 3` es un número válido y el cliente existe, pero su estado (`activo = false`) hace que la
operación no se permita. 400 = "tu petición está mal escrita"; 409 = "tu petición está bien escrita, pero no
se puede hacer en este momento".

---

## PREGUNTA 30
### Después de POST/PUT/DELETE: ¿actualizas estado local o haces refetch? Compara ambas estrategias.

**Las dos estrategias**

| | **Actualizar estado local** (lo que hago) | **Refetch** (volver a pedir la lista) |
|---|---|---|
| Cómo | `setClientes(prev => [...prev, saved])`, `map`, `filter` | Llamar a `reload()` → otro `GET /clientes` |
| Velocidad | Instantáneo, sin petición extra | Una petición más, un momento de "Cargando..." |
| Datos | Usa la respuesta del POST/PUT (que trae los datos reales del servidor) | Trae todo, incluidos cambios de **otros usuarios** |
| Riesgo | Duplicar lógica del servidor (orden, campos calculados); si la respuesta fuera parcial, la fila quedaría incompleta | Más tráfico; con listas enormes es costoso |
| Conserva la página/búsqueda | Sí | Sí (son estados aparte), pero se ve el "Cargando..." |

**Tu implementación** (`ClientesPage.tsx:71-80` y `:90`):
- POST → `[...prev, saved]` usando el objeto **del servidor** (con id real).
- PUT → `prev.map(...)` reemplazando con el objeto **del servidor**.
- DELETE → `prev.filter(...)` (el 204 no trae body, solo confirma).

Es un punto medio: actualizo localmente, pero **con datos que confirmó el backend**, nunca con lo que el
usuario escribió.

Y el refetch existe: `reload` del hook (`useAsyncList.ts:20-22`) se usa en el botón "Reintentar"
(`ClientesPage.tsx:108`).

**La estrategia puede variar por operación**: si un DELETE tuviera efectos en cascada (borrar un cliente
desactiva sus vehículos), o si el backend reordena la lista, o si una operación modifica varias entidades
(cambiar el estado de una orden y crear un registro de historial), conviene refetch. Ejemplo real en tu
proyecto: `OrdenDetalle` recarga el historial con un Effect cada vez que cambia `orden.estado`
(`OrdenDetalle.tsx:53-77`), porque el historial lo crea el backend.

**Repregunta de presión**: *Si el backend calcula un campo que el frontend no conoce, ¿qué ventaja tiene usar
la respuesta del servidor o hacer refetch?*

El valor calculado **solo lo conoce el servidor**: el `id` generado, una fecha de creación, un número de
orden correlativo, un total, un estado inicial... Si yo agregara a la tabla el `payload` que construí, ese
campo no existiría (o lo tendría que inventar, duplicando la lógica del backend y arriesgando que no
coincida). Usando la **respuesta del POST/PUT** (o haciendo refetch), la tabla muestra exactamente lo que
quedó guardado. Por eso el contrato de mi backend devuelve el objeto completo después de crear/actualizar.

---

## PREGUNTA 31
### Explica Promise, async/await, try/catch/finally y dónde debe vivir cada responsabilidad.

**Idea simple**

- Una **Promise** es un "vale" por un valor que llegará después (como el ticket de la tintorería). Puede
  terminar **resuelta** (llegó el valor) o **rechazada** (hubo error).
- **`async`** marca una función que **siempre devuelve una Promise**.
- **`await`** dice "espera a que esta Promise termine y dame su valor". Pausa **solo esa función**; el
  navegador sigue funcionando (puedes hacer scroll, la animación de "Cargando" se ve).

**`await` no congela el navegador**: JavaScript tiene un solo hilo. Mientras esperas el `fetch`, la función
se "aparta" y el hilo atiende otras cosas (clics, renders). Cuando llega la respuesta, la función continúa
donde quedó.

**try / catch / finally**

```ts
// ClienteForm.tsx:79-94
try {
    setSaving(true);
    const creado = await clienteService.crear(payload);   // si esto lanza, salta al catch
    onSaved(creado, 'create');                            // solo corre si NO hubo error
} catch (err) {
    setApiError(err instanceof Error ? err.message : 'No se pudo guardar');  // maneja el error
} finally {
    setSaving(false);                                     // corre SIEMPRE: con éxito o con error
}
```

- **try**: el camino feliz.
- **catch**: qué hacer si algo falló. `err` es de tipo `unknown` (podría ser cualquier cosa), por eso se
  revisa `err instanceof Error` antes de leer `.message`. Sin `any`.
- **finally**: limpieza que debe pasar siempre: apagar `saving`, `loading`, `deleting`.

**Dónde vive cada responsabilidad**

| Capa | Qué hace con los errores |
|---|---|
| `apiFetch` | **Detecta y lanza**: convierte respuestas no-ok en `ApiError`. No los muestra (no sabe de pantallas). |
| service | Los **deja pasar** (no tiene try/catch). |
| hook / página / form | **Atrapa y muestra**: `catch` → `setError`/`setApiError`/`setActionError`. `finally` apaga el loading. |

**Evitar catch vacíos**: `catch {}` sin hacer nada **esconde** el fallo: el usuario no ve mensaje, el
botón quizás queda bloqueado y tú no sabes por qué. El único "ignorar" justificado en tu código es el
**AbortError** (`useAsyncList.ts:34`), y es explícito: una cancelación no es un error real. (Los `catch`
sin variable de `sesionDemo.ts` sí hacen algo: usan el valor por defecto, y está comentado por qué.)

**Repregunta de presión**: *¿Qué ocurre con `saving=true` si haces `return` o `throw` y nunca lo
restableces?*

El botón queda **para siempre** en "Procesando..." y deshabilitado: el usuario no puede volver a guardar
hasta recargar la página. Por ejemplo, si `setSaving(false)` estuviera solo al final del `try`, cualquier
error (un 409) saltaría al `catch` y nunca llegaría a esa línea. Por eso va en **`finally`**, que se ejecuta
incluso si hay `return` o `throw` dentro del `try` o del `catch`. Ojo con el orden en mi código: el `return`
de la validación (línea 68) está **antes** de `setSaving(true)`, así que no deja nada colgado.

---

## PREGUNTA 32
### Haz un diagnóstico ordenado cuando Swagger funciona pero React no.

**Idea simple**: Swagger funcionando demuestra que **el backend y la base están bien**. Entonces el problema
está en **cómo** React hace la petición, o en algo que solo aplica al navegador (CORS). No hay que adivinar:
hay que **comparar** la petición de Swagger con la de React en la pestaña Network.

**Checklist en orden** (F12 → Network → clic en la petición):

| # | Qué reviso | Dónde lo veo | Error típico |
|---|---|---|---|
| 1 | ¿Aparece la petición? | Network | Si no aparece: error antes del fetch (p. ej. "Falta VITE_API_URL" en consola, `apiClient.ts:43`) |
| 2 | **URL completa** (host, puerto, base path) | Headers → Request URL | `localhost:8080` en vez de `9090`; falta o sobra `/api`; `.env.development` no recargado (hay que reiniciar `npm run dev` al cambiar el `.env`) |
| 3 | **Método** | Headers → Request Method | POST cuando debía ser PUT |
| 4 | **CORS** | Consola + estado "CORS error" / OPTIONS fallida | Origen no permitido (ver P23) |
| 5 | **Headers** | Request Headers | Falta `Content-Type: application/json` → Spring responde **415** |
| 6 | **Payload** | Payload / Request body | `clienteId: "3"` en vez de `3`; campo con otro nombre (`nombre` vs `nombreCompleto`); `""` en vez de `null` |
| 7 | **Status** | Status | 400/404/409/500 → leer Response |
| 8 | **Shape de la respuesta** | Response | El backend devuelve `{ content: [...] }` (paginado) y mi código espera un array |

Y lo comparo **campo por campo** con lo que funcionó en Swagger: misma URL, mismo método, mismo body.

**Repregunta de presión**: *Si React llama `/api/clientes` pero Swagger muestra `/clientes`, ¿qué evidencia
verías en Network?*

En Network: **Request URL** = `http://localhost:9090/api/clientes` y **Status 404**. En la pestaña Response,
el JSON de error de Spring (algo como `{"status":404,"error":"Not Found","path":"/api/clientes"}`). En
Swagger, la ruta que funciona es `/clientes` (sin `/api`). La corrección no es tocar los services: es
corregir la **URL base** en `.env.development` (`VITE_API_URL`), porque el base path es configuración del
entorno. (En tu proyecto real, el backend **sí** usa `/api`, por eso `VITE_API_URL` termina en `/api`.)
