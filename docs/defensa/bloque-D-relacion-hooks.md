# Bloque D — Relación 1:N, asincronía, hooks y UI avanzada (preguntas 33–42)

[← Volver al índice](README.md)

---

## PREGUNTA 33 — CRÍTICA
### Representa Cliente 1:N Vehículo desde el frontend y explica el papel de `clienteId`.

**Idea simple**

"1:N" significa: **un** cliente puede tener **muchos** vehículos, pero cada vehículo tiene **un solo**
dueño. Es como una madre y sus hijos: cada hijo tiene una madre, una madre puede tener varios hijos.
La forma de unirlos es que **cada vehículo guarde el número del cliente dueño**: eso es `clienteId`.

**Cómo se representa en cada capa**

| Capa | Representación |
|---|---|
| **PostgreSQL** | Columna `vehiculo.cliente_id` con `FOREIGN KEY` hacia `cliente.id`. La base **garantiza** que exista. |
| **Backend (JPA)** | Probablemente `@ManyToOne Cliente cliente` en la entidad. Pero el DTO expone solo `clienteId`. |
| **Contrato HTTP** | `{ "id": 5, "clienteId": 3, "placa": "ABC123", ... }` |
| **Frontend** | `Vehiculo.ts:4` → `clienteId: number`. **No** hay un objeto `cliente` dentro del vehículo. |

**¿Por qué solo `clienteId` y no todo el Cliente?**
- El JSON es más liviano.
- El nombre del cliente no queda **duplicado** en cada vehículo (si cambia, no hay que actualizar 10
  copias, ver P36).
- Al enviar (POST/PUT) solo necesito decir **quién** es el dueño, no reenviar sus datos.
- Evita ciclos (Cliente → vehículos → cliente → ...).

**Cómo se usa `clienteId` en tu frontend**
1. **Para elegir dueño**: el `<select>` de propietario guarda `clienteId` (como texto) en
   `VehiculoFormData` (`VehiculoForm.tsx:146`).
2. **Para enviar**: `clienteId: Number(formData.clienteId)` en el payload (`VehiculoForm.tsx:82`).
3. **Para mostrar el nombre**: `clientesById.get(vehiculo.clienteId)` (`VehiculoTable.tsx:37`).
4. **Para filtrar por dueño**: `vehiculo.clienteId === Number(filtros.clienteId)` (`vehiculoFilters.ts:23`).
5. **Para el Dashboard**: `new Set(vehiculos.data.map(v => v.clienteId))` → clientes con vehículo
   (`DashboardPage.tsx:21`).

**¿Quién valida la referencia?**
- Frontend (ayuda): solo deja elegir clientes activos (`VehiculoForm.tsx:149`) y `validarVehiculo` revisa
  que exista y esté activo (`vehiculoValidation.ts:29-37`, RN-01).
- Backend (autoridad): busca el cliente; si no existe → **404** (`ClienteNoEncontradoException`); si está
  inactivo → **409** (`PropietarioInactivoException`).
- Base de datos (garantía final): la FK rechaza un `cliente_id` inexistente.

**Repregunta de presión**: *¿Por qué enviar `clienteId` no significa que React "tenga una foreign key"
igual que PostgreSQL?*

Porque en React `clienteId` es **solo un número dentro de un objeto**: nadie garantiza que ese cliente
exista. Podría tener `clienteId: 999` y JavaScript no se quejaría. Una **foreign key** es una **restricción**
que la base de datos aplica **siempre**: no permite insertar un vehículo con un cliente que no existe, ni
borrar un cliente que tiene vehículos (por eso el 409 al eliminar). En el frontend lo que tengo es una
**referencia** sin garantías; por eso, si en la tabla no encuentro al dueño en el `Map`, muestro
`Cliente #${vehiculo.clienteId}` como respaldo (`VehiculoTable.tsx:46-48`) en vez de romperme.

---

## PREGUNTA 34
### Explica el `<select>` controlado de propietario y la conversión string → number.

**Idea simple**

Un `<select>` controlado funciona igual que un input controlado (P11): su `value` viene del estado y su
`onChange` actualiza el estado. Las opciones se generan a partir de la lista de clientes.

**1. Cargar los clientes antes de construir las opciones**

`VehiculosPage.tsx:18-19` usa **dos hooks**: `useVehiculos()` y `useClientes()`. Los dos Effects arrancan
en el mismo render, así que las dos peticiones viajan **en paralelo** (el mismo resultado que el
`Promise.all` de la Guía 07, pero con la lógica reutilizada de `useAsyncList`). La página espera a ambas:
```ts
const loading = vehiculosQuery.loading || clientesQuery.loading;   // línea 36
if (loading) return <div>Cargando vehiculos...</div>;               // línea 108
```
Así el formulario **nunca** se dibuja con el select vacío por falta de datos. Luego pasa
`clientes={clientes}` al form (línea 143).

**2. El select** (`VehiculoForm.tsx:146-155`)
```tsx
<select name="clienteId" value={formData.clienteId} onChange={handleChange}>
    <option value="">Seleccione un cliente</option>
    {clientes
        .filter((cliente) => cliente.activo)                     // RN-01: solo activos
        .map((cliente) => (
            <option key={cliente.id} value={String(cliente.id)}>
                {cliente.nombreCompleto} - {cliente.documento}
            </option>
        ))}
</select>
```
- `value={formData.clienteId}`: el estado manda qué opción está seleccionada. Es un **string** (`"3"`).
- `value={String(cliente.id)}`: las opciones también son string para que coincidan exactamente.
- La opción `""` representa "nada elegido" (estado inicial, `initialVehiculoForm.clienteId = ''`).
- Muestra nombre **y documento** para distinguir a dos clientes con el mismo nombre.

**3. Cambio**: `handleChange` (líneas 58-70) recibe `ChangeEvent<HTMLSelectElement>` y guarda
`e.target.value` (texto) en `formData.clienteId`.

**4. Validar y convertir** (al enviar):
- `vehiculoValidation.ts:29`: `Number(data.clienteId)` solo para **comparar** con los ids.
- `:34-37`: si está vacío → "Debe seleccionar un cliente"; si no existe o no está activo → "Seleccione un
  cliente valido y activo".
- `VehiculoForm.tsx:82`: recién aquí `clienteId: Number(formData.clienteId)` para el payload.

**5. Al editar**, el camino inverso: `clienteId: String(vehiculo.clienteId)` (`VehiculoForm.tsx:48`) para
que el select muestre al dueño actual.

**Repregunta de presión**: *¿Qué harías si el cliente seleccionado fue eliminado o desactivado justo antes
del POST?*

Mi lista de clientes en memoria está **desactualizada**, así que la validación local dice "OK" y envío el
POST. El backend es quien lo detecta:
- Cliente **desactivado** → **409** (`PropietarioInactivoException`, RN-01).
- Cliente **eliminado** → **404** (`ClienteNoEncontradoException`).

Mi frontend muestra ese mensaje en el formulario (`apiError`) y **no** agrega el vehículo. Lo que mejoraría:
después de ese error, recargar la lista de clientes (`clientesQuery.reload()`) para que el select ya no
ofrezca a ese cliente. Lo importante: **no confiar en que mi lista local es la verdad**; la verdad está en el
backend.

---

## PREGUNTA 35 — CRÍTICA
### Cambiar propietario de un Vehículo: recorre el PUT completo y explica qué debe ocurrir en UI y backend.

**Idea simple**: cambiar de dueño es **editar** el vehículo cambiando solo su `clienteId`. No es una
operación especial: es el mismo PUT de siempre.

**Recorrido completo**

1. **Clic en Editar** en la fila del vehículo `ABC123` (dueño actual: Ana, id 1) → `onEdit(vehiculo.id)` →
   `VehiculosPage.handleEdit` (líneas 66-77) → `GET /vehiculos/5` → `setEditingVehiculo(vehiculo)`.
2. **Precarga** (`VehiculoForm.tsx:40-56`): el Effect pone `clienteId: String(vehiculo.clienteId)` = `"1"`
   → el select muestra **"Ana Rojas"** seleccionada.
3. **Nueva selección**: el usuario elige "Luis Pérez" → `handleChange` → `formData.clienteId = "4"`.
4. **Submit**: `validarVehiculo` comprueba que el cliente 4 existe y está activo.
5. **Payload** (líneas 81-89): **todos** los campos (PUT es completo) con `clienteId: 4`.
6. **PUT**: `vehiculoService.actualizar(5, payload)` → `PUT /api/vehiculos/5` con
   `{"clienteId":4,"placa":"ABC123",...}`.
7. **Backend**: busca el vehículo 5 (404 si no existe) → busca el cliente 4 (404 si no existe) → revisa que
   esté activo (409 si no) → actualiza `cliente_id = 4` → responde **200** con el vehículo actualizado.
8. **UI**: `onSaved(actualizado, 'edit')` → `VehiculosPage.handleSaved` (línea 83) reemplaza la fila con
   `map` usando el objeto **devuelto por el servidor** (`clienteId: 4`).
9. **Re-render**: `VehiculoTable` hace `clientesById.get(4)` → la columna Propietario ahora dice
   **"Luis Pérez"**. No tuve que actualizar ningún "nombre del propietario": se **recalcula** desde el id.
10. Si hay filtro "Propietario: Ana" activo, el vehículo **desaparece** de la vista (ya no es de Ana): es
    correcto, porque la lista filtrada se deriva en cada render.
11. Si en el Dashboard Ana se queda sin vehículos, "Clientes sin vehículos" sube en 1 la próxima vez que se
    carga.

**Errores**: 404 (cliente o vehículo no existe) o 409 (cliente inactivo) → `catch` en el form → mensaje en
`apiError`; la fila **conserva** al dueño anterior porque no se llamó a `onSaved`.

**Repregunta de presión**: *Si el PUT actualiza la placa pero no el propietario, ¿qué comparaciones harías
entre payload, DTO y respuesta?*

Iría capa por capa para encontrar **dónde se pierde** el `clienteId`:
1. **Payload enviado** (Network → Payload): ¿dice `"clienteId": 4`? Si dice `1`, el problema es el
   formulario (el select no actualizó el estado, o el `name` del select no es `clienteId`).
2. **Nombre del campo**: ¿el backend espera `clienteId` o `idCliente` o `cliente: { id }`? Si el nombre no
   coincide, Jackson **ignora** el campo y no da error. Lo comparo con el Swagger.
3. **DTO del backend**: ¿`VehiculoRequest` tiene el campo `clienteId`? ¿El service del backend lo usa al
   actualizar, o solo copia placa/marca/modelo?
4. **Respuesta** (Network → Response): ¿devuelve `clienteId: 4` o `1`? Si la respuesta dice 1, el backend no
   lo guardó. Si dice 4 pero la tabla muestra a Ana, el problema está en mi `handleSaved` o en el `Map`.
5. **Base de datos**: `SELECT cliente_id FROM autocare.vehiculo WHERE id = 5;` como confirmación final.

---

## PREGUNTA 36
### ¿Cómo muestras el nombre del propietario sin duplicarlo de forma peligrosa dentro de Vehículo?

**Idea simple**

En vez de copiar el nombre del dueño dentro de cada vehículo, guardo solo el **número** del dueño y busco
el nombre **cuando lo necesito dibujar**, en la lista de clientes que ya tengo. Como una agenda: en tu
lista de cumpleaños pones "Juan", y su teléfono lo buscas en la agenda; si Juan cambia de teléfono, solo lo
cambias en un lugar.

**Tu código**

```ts
// VehiculosPage.tsx:120 — un índice id → cliente, calculado en cada render (estado derivado)
const clientesById = new Map(clientes.map((cliente) => [cliente.id, cliente]));

// VehiculoTable.tsx:37 — en cada fila
const propietario = clientesById.get(vehiculo.clienteId);

// :46-48
{propietario ? propietario.nombreCompleto : `Cliente #${vehiculo.clienteId}`}
```

También se usa en el buscador: `vehiculoFilters.ts:17-19` busca por el nombre del dueño usando el mismo
`Map`, sin que el vehículo tenga ese nombre.

**¿Por qué `Map` y no `find`?**
- `clientes.find(c => c.id === id)` recorre el array **en cada fila**: con 100 vehículos y 100 clientes son
  hasta 10.000 comparaciones.
- `Map.get(id)` va **directo** a la entrada (como buscar por índice de un libro). Se construye una vez por
  render.

**Evita "N+1"**: la alternativa ingenua sería hacer un `GET /clientes/{id}` **por cada fila** para obtener
el nombre: 1 petición para la lista + N peticiones para los dueños. Yo hago **2 peticiones en total**
(vehículos y clientes) y resuelvo los nombres en memoria (comentario de `VehiculoTable.tsx:36`).

**Peligro de duplicar**: si `Vehiculo` tuviera `propietarioNombre: "Ana Rojas"` y luego edito a Ana para
corregirlo a "Ana María Rojas", todos los vehículos seguirían mostrando el nombre viejo hasta recargarlos.
Habría dos verdades distintas.

**¿Cuándo sería mejor un DTO del backend con resumen del propietario?**
Cuando la lista de clientes es **muy grande** (no quiero descargar 50.000 clientes solo para mostrar 10
nombres), o cuando la tabla está **paginada en el servidor**. Ahí el backend haría un JOIN y devolvería
`{ ..., propietario: { id, nombreCompleto } }`, solo para mostrar. Esos datos serían de **solo lectura**
para la vista; al guardar se seguiría enviando solo `clienteId`.

**Repregunta de presión**: *Si cambia el nombre del Cliente, ¿qué enfoque evita tener que editar todos los
Vehículos en memoria?*

**Resolver el nombre por id en el render** (lo que hago). El nombre vive **solo** en la lista de clientes.
Cuando esa lista se actualiza (al recargar, o si se edita un cliente en la misma pantalla y se reemplaza con
`map`), en el siguiente render el `Map` se reconstruye y **todas** las filas de vehículos muestran el nombre
nuevo automáticamente, sin tocar ni un solo objeto `Vehiculo`.

---

## PREGUNTA 37
### Filtrar Vehículos por Cliente: compara filtrado frontend y endpoint filtrado en backend.

**Tu implementación (filtrado en el frontend)**

1. Estado fuente: `const [clienteFiltro, setClienteFiltro] = useState('');` (`VehiculosPage.tsx:24`).
   `''` significa "todos".
2. Select de filtro: `SelectFilter` con `propietarioOptions` (líneas 126-129 y 155-160).
3. Al cambiar → `handleClienteFiltro` (líneas 53-56): guarda el filtro y vuelve a página 1.
4. Derivación en cada render (línea 121-123) usando `matchesVehiculo` (`vehiculoFilters.ts:23`):
   ```ts
   const matchesOwner = filtros.clienteId === '' || vehiculo.clienteId === Number(filtros.clienteId);
   ```
   Se combina con AND con la búsqueda de texto y el estado activo/inactivo.

**Comparación**

| | **Frontend** (`filter` en memoria) | **Backend** (`GET /vehiculos?clienteId=3`) |
|---|---|---|
| Datos que se descargan | Todos los vehículos, una vez | Solo los del cliente |
| Velocidad al cambiar filtro | Instantáneo (sin red) | Una petición por cada cambio |
| Con pocos datos (decenas/cientos) | ✅ Ideal | Exagerado |
| Con muchos datos (miles/millones) | ❌ Lento, mucha memoria | ✅ Lo correcto (la base usa índices) |
| Paginación | Cliente (`paginate`) | Servidor: el backend devuelve una página + el **total real** |
| Complejidad | Baja | Más: query params, el filtro entra en las dependencias del Effect, cancelar peticiones viejas (P39) |

**Mi justificación**: para un taller con un volumen razonable de vehículos, ya tengo la lista cargada
(la necesito para la tabla), así que filtrar en memoria es lo más simple y rápido. La Guía 07 pide
justamente "filtro local por cliente".

**Si fuera en el backend**: el service tendría algo como
`listar({ clienteId, page, size }, signal)` → `apiFetch(\`/vehiculos?clienteId=${id}&page=${p}\`)`, y la
paginación usaría el `totalElements` que manda el servidor en lugar de `filtered.length`. El componente
`Pagination` **no cambiaría** (comentario de `Pagination.tsx:9`: no sabe si los datos vienen paginados del
cliente o del servidor).

**Repregunta de presión**: *Con 100.000 vehículos, ¿por qué descargar todo para luego `filter()` deja de
ser razonable?*

1. **Red**: 100.000 objetos JSON pueden ser decenas de MB. En un celular con mala conexión, tarda mucho.
2. **Memoria y CPU**: el navegador tiene que parsear todo ese JSON y guardarlo. Filtrar y paginar 100.000
   elementos **en cada render** (cada tecla en el buscador) se vuelve lento.
3. **Backend y base**: tiene que leer y serializar 100.000 filas en cada carga.
4. **Desperdicio**: el usuario ve 10 filas por página. Descargas 100.000 para mostrar 10.
5. **Frescura**: mientras más tiempo tienes esa copia gigante, más desactualizada está.
La base de datos está hecha para esto: con un índice en `cliente_id`, `WHERE cliente_id = 3 LIMIT 10` es
casi instantáneo.

---

## PREGUNTA 38 — CRÍTICA
### Explica `useEffect` con el modelo mental correcto: sincronización con sistemas externos.

**Idea simple**

`useEffect` **no** es "una función que corre una vez al inicio". Es la forma de decirle a React:
**"mantén sincronizado este componente con algo que está fuera de React"**. Ese "algo de afuera" puede ser
el backend (una petición), una API del navegador (`<dialog>.showModal()`), un temporizador, una suscripción.

**Las tres partes de un Effect**

```ts
useEffect(() => {
    // 1. SETUP: conectar / empezar a sincronizar
    return () => {
        // 2. CLEANUP: desconectar / deshacer lo anterior
    };
}, [dep1, dep2]);   // 3. DEPENDENCIAS: los valores de los que depende la sincronización
```

**Cómo lo ejecuta React**
1. El componente se dibuja en pantalla → React ejecuta el **setup**.
2. En un render posterior, si **alguna dependencia cambió** → React ejecuta el **cleanup** del Effect
   anterior y luego el **setup** nuevo.
3. Si ninguna cambió → no hace nada.
4. Cuando el componente se desmonta (sales de la página) → ejecuta el **cleanup** final.

**Tus Effects reales**

| Effect | Archivo | Sincroniza... | Dependencias | Cleanup |
|---|---|---|---|---|
| Cargar una lista | `useAsyncList.ts:24-46` | la data del componente con el backend | `[loader, reloadToken]` | `controller.abort()` |
| Cargar el historial de una orden | `OrdenDetalle.tsx:53-77` | el historial con el backend | `[orden.id, orden.estado]` | `ignore = true` + `abort()` |
| Abrir/cerrar el modal | `Modal.tsx:19-24` | la prop `open` con la API `<dialog>` | `[open]` | — (no hace falta) |
| Precargar el formulario | `ClienteForm.tsx:36-51` | el form con la prop `cliente` | `[cliente]` | — |

**Ejemplo explicado: `useAsyncList`**
- Setup: crea un `AbortController`, pone `loading`, llama al loader, guarda la data o el error.
- Dependencias: `loader` (qué cargar) y `reloadToken` (un número que cambia cuando quiero recargar).
  Cuando presionas "Reintentar", `reload()` hace `setReloadToken(v => v + 1)` → la dependencia cambia →
  React ejecuta el Effect de nuevo → nueva petición. Es un truco limpio para "volver a sincronizar".
- Cleanup: aborta la petición si el componente se desmonta o antes de una recarga.

**Nota honesta sobre el Effect de los formularios**: `oxlint` avisa `set-state-in-effect` en
`ClienteForm`/`VehiculoForm`. Copiar una prop al estado dentro de un Effect no es sincronizar con un
sistema externo; es el patrón que enseñan las Guías 06/07. La alternativa más "React" sería montar el form
con `key={editingCliente?.id ?? 'nuevo'}` e inicializar el estado directamente con
`useState(() => datosDelCliente)`: al cambiar la key, React crea un formulario nuevo ya precargado, sin
Effect.

**Repregunta de presión**: *Si una dependencia usada dentro del Effect cambia y no está declarada, ¿qué bug
aparece?*

Un **bug de datos obsoletos** ("stale closure"): el Effect sigue trabajando con el valor **viejo** porque
React no sabe que debe volver a ejecutarlo. Ejemplo concreto: si en `OrdenDetalle` quitara `orden.estado`
de las dependencias, al cambiar la orden de `DIAGNOSTICO` a `EN_TRABAJO` el historial **no se recargaría**
y la pantalla mostraría el historial viejo sin la última transición. Si quitara `orden.id`, al abrir otra
orden vería el historial de la anterior. Por eso la regla: **todo valor reactivo que se usa dentro del
Effect va en las dependencias**.

(Y el caso contrario: si `loader` fuera una función nueva en cada render, el Effect se repetiría sin fin.
Por eso el comentario de `useAsyncList.ts:10-11` exige pasar una referencia estable como
`clienteService.listar`, que está definida fuera del componente.)

---

## PREGUNTA 39 — CRÍTICA
### Explica cleanup, AbortController y cómo evitas respuestas obsoletas / race conditions.

**Idea simple**

Una **race condition** (condición de carrera) pasa cuando dos peticiones compiten y la que llega **última**
no es la que pediste **última**. Ejemplo: pides el historial de la orden A, cambias rápido a la orden B; si
la respuesta de A llega después que la de B, la pantalla mostraría A estando en B.

Herramientas:
- **`AbortController`**: un "control remoto" para **cancelar** una petición `fetch` en curso.
- **Cleanup**: el lugar donde React te avisa "esta sincronización ya no sirve".
- **Bandera `ignore`**: una variable que marca "esta respuesta ya no me interesa".

**Cómo lo haces en `useAsyncList.ts`**

```ts
useEffect(() => {
    const controller = new AbortController();              // línea 25: un controlador por ejecución
    const load = async () => {
        try {
            const result = await loader(controller.signal);// línea 31: el signal viaja hasta fetch
            setData(result);
        } catch (err) {
            if (!isAbortError(err)) {                      // línea 34: la cancelación NO es error
                setError(...);
            }
        } finally {
            if (!controller.signal.aborted) setLoading(false);  // línea 38
        }
    };
    void load();
    return () => controller.abort();                       // línea 45: cleanup → cancela
}, [loader, reloadToken]);
```

Camino del `signal`: `useAsyncList` → `clienteService.listar(signal)` → `apiFetch('/clientes', { signal })`
→ `fetch(url, { ...options })`. Cuando se llama `controller.abort()`, el navegador corta la petición y
`fetch` rechaza con un `DOMException` llamado **`AbortError`**.

**Diferenciar AbortError de un error real** (`shared/utils/isAbortError.ts`):
```ts
return error instanceof DOMException && error.name === 'AbortError';
```
- AbortError → **lo ignoro**: yo mismo cancelé, no es un problema. No muestro "Error".
- `ApiError` (409, 500...) o `TypeError` de red → **es un error real**: lo muestro.

**En `OrdenDetalle.tsx:53-77` uso las dos defensas juntas**:
```ts
const controller = new AbortController();
let ignore = false;
// ... if (!ignore) setHistorial(data);
return () => {
    ignore = true;          // aunque la respuesta llegue, no se aplica
    controller.abort();     // y además se intenta cancelar la petición
};
```
¿Por qué las dos? `abort()` corta la petición, pero si la respuesta **ya había llegado** y se estaba
procesando (por ejemplo, entre el `await` y el `setHistorial`), la bandera `ignore` garantiza que no se
aplique.

**Repregunta de presión**: *Si buscas A y enseguida B, pero la respuesta de A llega después, ¿cómo evitas
mostrar A como si fuera el resultado actual?*

Si la búsqueda fuera en el backend, el término iría en las **dependencias** del Effect. Al pasar de A a B:
1. React ejecuta el **cleanup** del Effect de A → `controller.abort()` cancela la petición A e
   `ignore = true`.
2. Ejecuta el **setup** de B → nueva petición con su propio controller.
3. Si la respuesta de A llega igual (ya estaba en camino), su `fetch` rechaza con AbortError (ignorado) o,
   si ya había resuelto, la bandera `ignore` de A está en `true` y **no hace `setState`**.
4. Solo la respuesta de B actualiza la pantalla.
Cada ejecución del Effect tiene **su propio** controller y su propia bandera (son variables locales de esa
ejecución), por eso no se mezclan. Hoy mi buscador filtra en memoria (no hay petición por tecla), pero el
mismo patrón ya se aplica en el historial de órdenes al cambiar de orden o de estado.

---

## PREGUNTA 40
### ¿Por qué un Effect puede ejecutarse dos veces en desarrollo con StrictMode y qué debes hacer?

**Idea simple**

En desarrollo, `StrictMode` (activado en `main.tsx:11`) hace a propósito una **prueba de estrés**: monta el
componente, ejecuta el Effect, **lo desmonta de mentira** (ejecuta el cleanup) y lo vuelve a montar
(ejecuta el setup otra vez). Es como desenchufar y volver a enchufar un aparato para comprobar que se
apaga bien.

**¿Para qué?** Para que descubras Effects **frágiles**: los que no tienen cleanup o no lo hacen bien. En la
vida real, un componente se monta y desmonta muchas veces (cambias de página, vuelves, React reutiliza
pantallas). Si tu Effect no aguanta "montar → limpiar → montar", tiene un bug que tarde o temprano aparece.

**Lo que ves en tu proyecto**: en Network, al entrar a `/clientes` en desarrollo aparecen **dos** peticiones
`GET /clientes`: la primera con estado **(canceled)** y la segunda **200**. Es exactamente lo esperado:
1. Setup #1 → petición 1.
2. Cleanup (simulado) → `controller.abort()` → petición 1 cancelada (y el `AbortError` se ignora).
3. Setup #2 → petición 2 → esta es la que actualiza el estado.
Y la pantalla funciona perfecto: esa es la prueba de que mi cleanup es correcto.

**Qué debes hacer**: **arreglar el Effect** (cleanup correcto, que sea idempotente), **no** quitar
`StrictMode`. Quitarlo solo esconde el problema.

**Desarrollo vs. producción**: esta doble ejecución **solo pasa en desarrollo** (`npm run dev`). En
producción (`npm run build`) StrictMode no hace nada extra: cada Effect corre una vez por montaje.

**Repregunta de presión**: *Si tu Effect crea una suscripción y no la limpia, ¿qué síntoma revela
StrictMode?*

Quedan **dos suscripciones activas** al mismo tiempo. Síntomas:
- Los eventos se procesan **dos veces**: un mensaje aparece duplicado, un contador sube de 2 en 2, un
  `setInterval` corre al doble de velocidad, un listener de `window` reacciona dos veces.
- **Fugas de memoria**: la suscripción sigue viva aunque el componente se haya ido, y puede intentar hacer
  `setState` sobre un componente desmontado.
- Para peticiones sin abort: dos respuestas que pueden pisarse (race condition).
StrictMode hace visible en el minuto 1 de desarrollo un bug que en producción aparecería solo "a veces".

---

## PREGUNTA 41
### ¿Qué problema resuelven `useAsyncList<T>`, `useClientes` y `useVehiculos`?

**Idea simple**

Antes de la Guía 08, **cada página** repetía el mismo código: `useState` para data, para loading, para
error, un `useEffect` con try/catch/finally, el AbortController... Un **custom hook** es una función que
empieza con `use` y agrupa esa lógica para **reutilizarla**.

**Dos niveles** (separación genérico vs. dominio)

1. **`shared/hooks/useAsyncList.ts`** — **genérico** (no sabe de clientes ni vehículos):
   - `<T>` es un **genérico**: "funciono con cualquier tipo de elemento". Con `Cliente`, `data` es
     `Cliente[]`; con `Vehiculo`, es `Vehiculo[]`. TypeScript lo deduce.
   - Recibe un `loader: (signal) => Promise<T[]>` (qué cargar).
   - Maneja la **mecánica**: `data`, `loading`, `error`, cancelación con AbortController, ignorar AbortError
     y `reload`.
   - Devuelve `{ data, setData, loading, error, reload }` (línea 48).

2. **`features/clientes/hooks/useClientes.ts`** y **`features/vehiculos/hooks/useVehiculos.ts`** — **de
   dominio**:
   ```ts
   export function useClientes() {
       return useAsyncList<Cliente>(clienteService.listar);
   }
   ```
   Expresan la **intención** ("quiero los clientes") y esconden de qué service vienen. La página no tiene que
   saber que existe `useAsyncList`.

**Qué devuelve y para qué sirve cada cosa**

| Campo | Uso en la página |
|---|---|
| `data` | La lista (renombrada a `clientes`) |
| `loading` | Mostrar "Cargando..." |
| `error` | Mostrar el error de carga + Reintentar (`loadError`) |
| `reload` | Botón Reintentar → vuelve a ejecutar el Effect (refetch) |
| `setData` | **Mutaciones**: después de POST/PUT/DELETE exitoso, la página actualiza la lista con `map`/`filter` sin volver a pedirla |

**Dónde se reutiliza**: `useClientes` lo usan `ClientesPage`, `VehiculosPage` (para el select y el Map) y
`DashboardPage`. `useVehiculos` lo usan `VehiculosPage` y `DashboardPage`. Y `useAsyncList` también lo usan
`useServicios`, `useOrdenes` y `useUsuarios`.

**Repregunta de presión**: *Si dos componentes llaman al mismo custom hook, ¿comparten siempre el mismo
`useState`? ¿Por qué?*

**No.** Un custom hook comparte **lógica**, no **datos**. Cada vez que un componente llama a `useClientes()`,
los `useState` de dentro se crean **para ese componente**, como si hubieras escrito esos `useState`
directamente en él. Ejemplo real: `DashboardPage` y `ClientesPage` llaman a `useClientes()`; cada una hace su
propio `GET /clientes` y tiene su propia copia de la lista. Si creas un cliente en `ClientesPage`, el
`data` del Dashboard **no cambia** hasta que el Dashboard se monte de nuevo (cuando vuelves a "Inicio",
se vuelve a cargar). Lo dice el comentario de `useAsyncList.ts:8`: "se reutiliza la lógica, no los datos".
Para **compartir** estado de verdad se usa un **Context** (como hice con `SesionDemoProvider` para el
usuario demo) o una librería de caché.

---

## PREGUNTA 42
### Defiende tus componentes UI compartidos, `useMemo`, design tokens y decisiones de accesibilidad.

**Componentes UI (`src/components/ui/`) — todos sin conocimiento del dominio**

| Componente | Props / variantes | Decisión de diseño |
|---|---|---|
| `Button` | `variant: 'primary' \| 'secondary' \| 'danger' \| 'ghost'`, `loading`, + todos los atributos nativos de `<button>` | `type="button"` por defecto (línea 16) para no enviar formularios por accidente; `loading` deshabilita y muestra "Procesando..." |
| `SearchInput` | `value`, `onChange(texto)`, `label`, `placeholder` | Controlado; no filtra, solo emite el texto |
| `SelectFilter` | `label`, `value`, `options[]`, `onChange` | Sirve para estado, propietario y tamaño de página |
| `Pagination` | `page`, `totalPages`, `onPageChange` | Deshabilita Anterior/Siguiente en los extremos |
| `Modal` | `open`, `title`, `onClose`, `size: 'md' \| 'lg'` | `<dialog>` nativo |
| `ConfirmDialog` | `open`, `title`, `message`, `confirming`, `onConfirm`, `onCancel` | Construido sobre `Modal` |
| `EmptyState` | `title`, `description` | Distingue "sin datos" de "sin resultados" |
| `StatusBadge` | `active: boolean` | Texto + color |
| `MetricCard` | `label`, `value`, `helper` | Para el Dashboard |

`Button` extiende `ButtonHTMLAttributes<HTMLButtonElement>` (línea 6): así acepta `onClick`, `disabled`,
`aria-label`... sin declararlos uno por uno, y el resto se pasa con `{...props}`.

**`useMemo`**

`useMemo(() => calculo, [deps])` guarda el resultado de un cálculo y lo reutiliza mientras las
dependencias no cambien. Es una **optimización**, **no** un requisito para que el código sea correcto: el
resultado es el mismo con o sin `useMemo`.

En mi proyecto **no lo uso**: `filtered`, `visible` y `clientesById` se recalculan en cada render. Con
listas de decenas o cientos de elementos, eso tarda microsegundos; agregar `useMemo` sería complejidad sin
beneficio medible. Lo usaría si midiera (con el Profiler de React DevTools) que un cálculo es lento, por
ejemplo filtrar miles de registros en cada tecla.

**Design tokens** (`styles/tokens.css`)

Variables CSS en `:root` con los valores de diseño: `--color-primary`, `--color-danger`, `--radius-sm`,
`--space-4`, etc. `ui.css` usa **solo tokens** (`background: var(--color-accent)`). Ventajas: cambiar el
color principal de toda la app en **un solo lugar**, consistencia visual (no hay 15 azules distintos) y
facilita un modo oscuro en el futuro (redefiniendo los tokens).

**Accesibilidad**

- **Labels**: todos los inputs están dentro de un `<label>` con texto visible (`SearchInput.tsx:16-17`,
  `ClienteForm.tsx:102-104`). Así el lector de pantalla anuncia "Documento, cuadro de texto", y hacer clic en
  el texto enfoca el input. No dependo solo del `placeholder` (desaparece al escribir). Lo prueba
  `SearchInput.test.tsx:19-22`.
- **Botones semánticos**: uso `<button>`, no `<div onClick>`. Un `<button>` es enfocable con Tab y se activa
  con Enter/Espacio sin programarlo.
- **Foco visible**: `.btn:focus-visible { outline: 3px solid ... }` en `ui.css`.
- **No solo color**: `StatusBadge` muestra el texto "Activo"/"Inactivo" además del verde/rojo, para personas
  que no distinguen colores (comentario de la línea 1).
- **Roles y ARIA**: `role="alert"` en errores (se anuncian de inmediato), `role="status"` en mensajes de
  éxito y `EmptyState`, `aria-label="Navegación principal"` en el menú, `aria-label="Paginacion"`,
  `aria-labelledby` en el modal, `aria-label="Cerrar"` en la "×".
- **Contraste**: textos oscuros (`--color-text: #1d2733`) sobre fondo blanco; badges con fondo claro y texto
  oscuro del mismo tono.

**Repregunta de presión**: *¿Cómo demostrarías que un modal funciona para un usuario que navega solo con
teclado?*

Lo probaría **sin tocar el mouse**:
1. Con **Tab** llego al botón "Eliminar" de una fila y presiono **Enter** → el modal se abre.
2. Compruebo que el **foco entró al modal** (`showModal()` lo mueve al primer elemento enfocable, el botón
   "×").
3. Con **Tab** recorro "×" → "Cancelar" → "Eliminar" y el foco **no se escapa** al contenido de atrás (el
   fondo queda inerte con `showModal()`).
4. Presiono **Escape** → el modal se cierra (el `<dialog>` dispara `close` → `onClose` → `onCancel`), y no se
   hizo ningún DELETE.
5. Al cerrar, el foco **vuelve** al botón que lo abrió (lo hace el `<dialog>` nativo).
6. Lo puedo automatizar con Testing Library: `user.keyboard('{Escape}')` y comprobar que `onCancel` fue
   llamado. (Detalle: jsdom tiene soporte limitado de `<dialog>`, así que esta prueba se hace mejor en un
   navegador real.)
