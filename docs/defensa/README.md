# Defensa oral del frontend — Respuestas a las 50 preguntas

Respuestas al banco **"EXAMEN_PROGRAMACION_APLICADA_2026_2_SEGUNDO_PARCIAL_FRONTEND"**, aplicadas a
**tu** proyecto AutoCare360 (no a ParkFlow360). Cada respuesta usa archivos y números de línea reales
para que puedas abrir WebStorm y señalar el código mientras explicas.

| Archivo | Preguntas | Tema |
|---|---|---|
| [bloque-A-arquitectura.md](bloque-A-arquitectura.md) | 01–10 | Arquitectura, Vite, TypeScript, Router |
| [bloque-B-componentes-estado.md](bloque-B-componentes-estado.md) | 11–20 | Componentes, estado, formularios, UI |
| [bloque-C-http-crud.md](bloque-C-http-crud.md) | 21–32 | HTTP, services, CRUD fullstack |
| [bloque-D-relacion-hooks.md](bloque-D-relacion-hooks.md) | 33–42 | Relación 1:N, useEffect, hooks, UI avanzada |
| [bloque-E-testing-build.md](bloque-E-testing-build.md) | 43–50 | Testing, build, producción, flujo completo |

---

## Cómo te va a evaluar el profesor (lee esto primero)

Cada pregunta vale 0, 1 o 2 puntos. Para sacar **2** tienes que hacer 5 cosas:

1. **Definir**: explicarlo con tus palabras, sin leer.
2. **Ubicar**: abrir el archivo y señalar la línea.
3. **Recorrer**: decir qué pasa antes y después de ese punto.
4. **Justificar**: por qué se hizo así y qué otra opción había.
5. **Predecir**: qué pasaría si lo borras, lo cambias o falla.

Por eso cada respuesta tiene esta estructura:

- **Idea simple**: el concepto explicado como si nunca lo hubieras visto.
- **En tu proyecto**: dónde está en tu código.
- **Recorrido / explicación**: paso a paso.
- **Por qué así**: la justificación y la alternativa.
- **¿Qué pasa si...?**: la predicción.
- **Repregunta de presión**: la respuesta a la pregunta difícil que viene después.

> ⚠️ El banco está escrito para ParkFlow360. En tu proyecto hay diferencias que debes conocer para no
> contradecirte:
> - Tu variable de entorno se llama `VITE_API_URL` (no `VITE_API_BASE_URL`).
> - Tu backend corre en el puerto **9090** (no 8080) y sus rutas empiezan con `/api`.
> - Tu `Vehiculo` **no tiene `anio`**; tiene `vin`, `color` y `activo`. El campo que se guarda como texto
>   en el formulario y luego se convierte a número es `clienteId` (y `precio` en Servicios).
> - Tu `Cliente` usa `nombreCompleto` y `documento` (no nombre/apellido).
> - No existe `npm run backend:check` en tu `package.json`.

---

## El mapa mental que debes tener en la cabeza

Casi todas las preguntas se responden con este dibujo. Apréndelo y dibújalo en la pizarra:

```
 USUARIO hace clic / escribe
        │
        ▼
 ┌──────────────────────── NAVEGADOR (frontend, tu código) ─────────────────────────┐
 │                                                                                  │
 │  index.html  →  main.tsx  →  App.tsx  →  AppRouter  →  MainLayout  →  Page       │
 │  (div#root)    (createRoot)              (Routes)      (Outlet)                  │
 │                                                                                  │
 │  Page (ClientesPage)          ← coordina: tiene el estado y decide qué hacer     │
 │    ├─ Form / Table / UI       ← muestran datos (props) y avisan eventos (callbacks)
 │    ├─ hook (useClientes)      ← maneja data / loading / error / reload           │
 │    └─ service (clienteService)← sabe las rutas: GET /clientes, POST /clientes... │
 │          └─ apiFetch          ← arma la URL, headers, revisa response.ok         │
 │                └─ fetch()     ← Web API del navegador: envía la petición HTTP    │
 └──────────────────────────────────────│───────────────────────────────────────────┘
                                        │ HTTP (JSON)  http://localhost:9090/api/...
                                        ▼
 ┌──────────────────────── BACKEND Spring Boot (otro proyecto) ─────────────────────┐
 │  CORS → Controller → DTO + @Valid → Service (reglas RN) → Repository → PostgreSQL│
 └──────────────────────────────────────│───────────────────────────────────────────┘
                                        │ respuesta: status (200/201/204/4xx/5xx) + JSON
                                        ▼
 apiFetch: ¿response.ok? → sí: response.json()  /  no: lanza ApiError
        → service devuelve la Promise → Page hace setState(...)
        → React vuelve a ejecutar el componente (re-render) → la pantalla cambia
```

**Frase clave para el examen**: *"La UI solo cambia después de que el backend responde con éxito, y
usamos el objeto que devuelve la API."*

## Verificación del proyecto (hecha el 2026-10-09)

- `npm run test:run` → **10 archivos, 30 tests, todos pasan**.
- `npm run build` → genera `dist/index.html`, `dist/assets/index-*.css` y `dist/assets/index-*.js`.
