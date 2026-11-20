# AutoCare360 — Matriz de pruebas Fullstack (Guía 10)

Entorno: backend Spring Boot en `http://localhost:9090`, frontend `npm run dev` en `http://localhost:5173`,
PostgreSQL local (`autocare360`, schema `autocare`).

Completar **Resultado** (OK / FALLA) y **Evidencia** (captura de Network, consulta SQL, etc.) ejecutando cada caso.

| ID | Prueba | Pasos | Esperado | Capa | Resultado | Evidencia |
|----|--------|-------|----------|------|-----------|-----------|
| F01 | Abrir Dashboard | Ir a `/` | Métricas visibles y coherentes con las tablas | UI + GET | | |
| F02 | Crear Cliente válido | Formulario Clientes → Crear | 201, fila nueva visible; existe en `autocare.cliente` | POST | | |
| F03 | Crear Cliente inválido | Documento vacío / email mal escrito / documento repetido | Error junto al campo (front) o 400/409 del backend | Validación | | |
| F04 | Editar Cliente | Editar → cambiar teléfono → Actualizar | 200; tabla y BD con el valor nuevo | PUT | | |
| F05 | Crear Vehículo | Seleccionar propietario → Crear | 201; `vehiculo.cliente_id` correcto | POST + FK | | |
| F06 | Cambiar propietario | Editar vehículo → otro propietario → Actualizar | `cliente_id` cambia al nuevo cliente | PUT + FK | | |
| F07 | Filtrar Vehículos | Filtro "Propietario" | Solo vehículos de ese cliente | Estado derivado | | |
| F08 | Paginar y buscar | Crear >10 registros, buscar texto | La búsqueda actúa antes de paginar | UI | | |
| F09 | Eliminar Vehículo | Eliminar → Confirmar | 204; desaparece solo tras la respuesta | DELETE | | |
| F10 | Eliminar Cliente con vehículos | Eliminar cliente que tiene vehículos | 409; mensaje visible; la fila se conserva | 409 | | |
| F11 | Recargar `/clientes` | F5 en `/clientes` y `/vehiculos` | La SPA vuelve a cargar en la misma ruta | Routing/Fallback | | |
| F12 | Backend apagado | Detener Spring Boot y abrir `/clientes` | Mensaje de error comprensible + botón Reintentar | Red/HTTP | | |

## Verificaciones automáticas ya ejecutadas (2026-10-08)
- `npm run test:run` → 7 archivos, 18 tests en verde.
- `npm run build` → sin errores; el bundle usa la URL de `.env.production`.
- `npm run preview` → `/`, `/clientes`, `/vehiculos` y rutas inexistentes devuelven `index.html` (fallback SPA).
- Backend: casos 201/200/204/400/404/409 y CORS probados con `requests.http` / curl.

## Consultas SQL de apoyo (DataGrip)
```sql
-- F02/F04: cliente persistido
SELECT * FROM autocare.cliente ORDER BY cliente_id DESC;

-- F05/F06: vehiculo y su propietario (FK)
SELECT v.vehiculo_id, v.placa, v.cliente_id, c.nombre_completo
FROM autocare.vehiculo v
JOIN autocare.cliente c ON c.cliente_id = v.cliente_id
ORDER BY v.vehiculo_id DESC;
```

## Checklist de despliegue (sección 21 de la guía)
- [ ] `.env.production` apunta al backend real (hoy tiene una URL de ejemplo) y no contiene secretos.
- [ ] El backend autoriza el origen real del frontend: propiedad `app.cors.allowed-origins` en Spring Boot.
- [ ] HTTPS en frontend y backend.
- [ ] El servidor estático redirige cualquier ruta a `index.html` (p. ej. Nginx `try_files $uri $uri/ /index.html;`).
- [x] `npm run test:run` sin fallos.
- [x] `npm run build` sin errores TypeScript.
- [x] `npm run preview` navega y recarga rutas directas.
- [ ] Matriz F01–F12 completada.
