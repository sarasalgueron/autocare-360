# Modelo conceptual v0.1 — AutoCare 360 (PA-02)

## 1. Objetivo
Este documento define formalmente el modelo conceptual de datos para el proyecto **AutoCare 360 (Código PA-02)**, un taller automotriz de alta complejidad intermedia que requiere el control del ciclo de vida de órdenes de servicio, tareas técnicas, estimaciones y carga de evidencias. Este análisis sirve como base para el diseño lógico, normalización e implementación física posterior de la base de datos en PostgreSQL, alineándose con las directrices de ingeniería de la Clase 02 de Programación Aplicada.

## 2. Fuente analizada
*   **Proyecto asignado**: AutoCare 360 (Taller Automotriz, Órdenes de Servicio y Seguimiento - PA-02).
*   **Secciones revisadas de la ficha oficial**: 
    *   **A. Situación del cliente**: Transición de formularios físicos a plataforma web interna y app móvil.
    *   **B. Objetivo contractual del producto**: Control de extremo a extremo del flujo transaccional.
    *   **C. Actores y responsabilidades**: Administrador, Asesor de servicio, Técnico y Cliente/propietario.
    *   **D. Alcance funcional cerrado**: Módulos funcionales del sistema (Clientes, Vehículos, Servicios, Órdenes, Estimaciones, Evidencias, Notificaciones y Reportes).
    *   **E. Reglas de negocio obligatorias**: RN-01 a RN-08.
    *   **F. Modelo de información mínimo esperado**: Conceptos y responsabilidades mínimas.
    *   **G. Requisitos funcionales predefinidos**: RF-01 a RF-20.
    *   **J. Flujo crítico**: Asesor abre orden -> técnico recibe tareas -> se genera estimación -> cliente aprueba desde móvil -> técnico actualiza trabajo -> asesor entrega vehículo.

---

## 3. Candidatos analizados (Inventario Conceptual)

| Candidato | Clasificación | Justificación | Fuente en la ficha |
| :--- | :--- | :--- | :--- |
| **Cliente** | Entidad | **Tiene identidad propia y requiere persistencia.** Almacena datos obligatorios de contacto y vinculación de activos de forma permanente. | Sección F-1, RF-05, RN-01 |
| **Vehiculo** | Entidad | **Posee identidad única de negocio (placa/VIN) que no se puede duplicar.** Es el objeto sobre el cual se realizan los mantenimientos. | Sección F-2, RF-06, RF-15 |
| **ServicioCatalogo** | Entidad | **Catálogo de servicios parametrizables por el administrador.** Permite estandarizar los trabajos y costos base del taller. | Sección F-3, RF-07 |
| **OrdenServicio** | Entidad | **Entidad transaccional central.** Representa el ciclo completo de atención del vehículo, desde la recepción hasta la entrega definitiva. | Sección F-4, RF-08, RN-03 |
| **TareaOrden** | Entidad | **Sub-elemento con identidad propia dentro de una orden.** Requiere un técnico responsable asignado y un estado específico de avance. | Sección F-5, RF-09, RN-06 |
| **Estimacion** | Entidad | **Concepto transaccional que agrupa repuestos y servicios cotizados.** Debe admitir control de versiones ante cambios de alcance o costos. | Sección F-6, RF-10, RN-04 |
| **ItemEstimacion** | Entidad | **Entidad dependiente (débil) que detalla individualmente cada repuesto o servicio** asociado a una estimación específica. | Sección F-7, RF-10 |
| **Evidencia** | Entidad | **Registro de soporte multimedia (imágenes o archivos) del estado del vehículo.** Requiere persistir una descripción y asociarse a una orden. | Sección F-8, RF-11, RN-08 |
| **HistorialEstadoOrden** | Entidad | **Registro histórico con fines de auditoría.** Guarda los cambios de estado del negocio, registrando fecha, hora y usuario responsable. | Sección F-9, RF-12, RF-04 |
| **AprobacionCliente** | Entidad | **Documenta la decisión transaccional del cliente.** Almacena formalmente la aceptación o rechazo de una estimación con su respectiva fecha. | Sección F-10, RF-17, RN-05 |
| **Notificacion** | Entidad | **Registro de mensajes transaccionales enviados a los usuarios** sobre hitos clave (aprobación de estimación, orden lista para entrega). | Sección F-11, RF-13 |
| **Administrador** | Actor / Rol | **Usuario interno del sistema que no requiere persistir datos operativos propios,** sino credenciales y permisos para supervisar y configurar catálogos. | Sección C, RF-01 |
| **Asesor de servicio** | Actor / Rol | **Usuario interno que interactúa con el sistema.** Es el responsable de iniciar el flujo de negocio operando los procesos transaccionales diarios. | Sección C, RF-01 |
| **Técnico** | Actor / Rol | **Usuario interno que ejecuta el trabajo.** Recibe tareas, actualiza estados y aporta evidencias de seguimiento a través de la aplicación. | Sección C, RF-01, RN-06 |
| **Cliente/propietario** | Actor | **Usuario externo de autoservicio.** Consulta el avance de sus vehículos y aprueba/rechaza estimaciones desde la aplicación móvil. | Sección C, RN-05, Exp. Móvil |
| **Estado de Orden** | Estado | **No es una entidad.** Es una condición o valor de dominio (`ABIERTA`, `DIAGNOSTICO`, etc.) por la cual transita la entidad `OrdenServicio`. | RN-02 |
| **Placa / VIN** | Atributo | **No tiene vida propia.** Son valores atómicos simples que identifican de manera única a la entidad `Vehiculo` en el sistema. | RF-15 |
| **Kilometraje de salida** | Atributo | **Propiedad atómica de salida.** Se captura obligatoriamente solo al registrar la entrega final del vehículo para cerrar la orden. | RN-07 |

---

## 4. Entidades núcleo v0.1

### [Cliente]
*   **Responsabilidad**: Almacenar la información de contacto, identificación fiscal y personal del dueño de los vehículos que ingresan al taller.
*   **Atributos conceptuales**: 
    *   `id_cliente` (Identificador del sistema - Obligatorio)
    *   `numero_identificacion` (Cédula/RUT de negocio - Obligatorio, único)
    *   `nombre_completo` (Nombre comercial o de persona natural - Obligatorio)
    *   `telefono_contacto` (Obligatorio)
    *   `correo_electronico` (Obligatorio, único para acceso móvil)
    *   `direccion_residencia` (Opcional)
    *   `fecha_registro` (Obligatorio)
*   **Identificador de negocio candidato**: `numero_identificacion` y `correo_electronico`.

### [Vehiculo]
*   **Responsabilidad**: Registrar la hoja de vida técnica del vehículo (marca, modelo, año, número de chasis/VIN) para asociarle órdenes de servicio.
*   **Atributos conceptuales**: 
    *   `id_vehiculo` (Identificador del sistema - Obligatorio)
    *   `placa` (Identificador de negocio visible - Obligatorio, único)
    *   `vin` (Número de Identificación Vehicular - Obligatorio, único)
    *   `marca` (Obligatorio)
    *   `modelo` (Obligatorio)
    *   `año` (Obligatorio)
    *   `color` (Opcional)
    *   `id_cliente_propietario` (Relación obligatoria - Obligatorio)
*   **Identificador de negocio candidato**: `placa` y `vin`.

### [ServicioCatalogo]
*   **Responsabilidad**: Mantener el catálogo de servicios estandarizados ofrecidos por el taller con sus precios y tiempos estándar de referencia.
*   **Atributos conceptuales**: 
    *   `id_servicio` (Identificador del sistema - Obligatorio)
    *   `codigo_servicio` (Código de negocio - Obligatorio, único)
    *   `nombre_servicio` (Obligatorio)
    *   `descripcion_detallada` (Opcional)
    *   `precio_base` (Valor numérico monetario - Obligatorio)
    *   `tiempo_estimado_minutos` (Obligatorio)
    *   `activo` (Indicador de vigencia - Obligatorio)
*   **Identificador de negocio candidato**: `codigo_servicio`.

### [OrdenServicio]
*   **Responsabilidad**: Controlar el ciclo de vida, estados, kilometrajes e información técnica global del vehículo durante su estadía en el taller.
*   **Atributos conceptuales**: 
    *   `id_orden` (Identificador del sistema - Obligatorio)
    *   `numero_orden_correlativo` (Identificador de negocio incremental - Obligatorio, único)
    *   `id_vehiculo` (Relación obligatoria - Obligatorio)
    *   `estado_orden` (Estados permitidos: ABIERTA, DIAGNOSTICO, ESPERA_APROBACION, EN_TRABAJO, LISTA_ENTREGA, ENTREGADA, CANCELADA - Obligatorio)
    *   `kilometraje_ingreso` (Valor numérico positivo - Obligatorio)
    *   `kilometraje_salida` (Valor numérico obligatorio al entregar - Opcional inicialmente)
    *   `observaciones_ingreso` (Detalle de recepción - Obligatorio)
    *   `observaciones_salida` (Detalle de entrega - Opcional inicialmente)
    *   `fecha_apertura` (Obligatorio)
    *   `fecha_entrega_real` (Opcional)
*   **Identificador de negocio candidato**: `numero_orden_correlativo`.

### [TareaOrden]
*   **Responsabilidad**: Desglosar los trabajos específicos (mecánicos, eléctricos, preventivos) que componen la orden de servicio, asignándoles un técnico responsable y rastreando su progreso individual.
*   **Atributos conceptuales**: 
    *   `id_tarea` (Identificador del sistema - Obligatorio)
    *   `id_orden` (Relación obligatoria - Obligatorio)
    *   `id_servicio_catalogo` (Relación al catálogo de servicios - Obligatorio)
    *   `descripcion_adicional` (Detalle o aclaración técnica - Opcional)
    *   `id_usuario_tecnico` (Responsable de la ejecución - Obligatorio)
    *   `estado_tarea` (Valores: ASIGNADA, EN_PROGRESO, COMPLETADA - Obligatorio)
    *   `fecha_asignacion` (Obligatorio)
    *   `fecha_cierre` (Opcional)
*   **Identificador de negocio candidato**: Clave compuesta (`id_orden`, `id_servicio_catalogo`) o correlativo interno por orden.

### [Estimacion]
*   **Responsabilidad**: Consolidar los costos proyectados de repuestos y servicios adicionales para la aprobación formal del cliente, soportando un control histórico mediante versionamiento.
*   **Atributos conceptuales**: 
    *   `id_estimacion` (Identificador del sistema - Obligatorio)
    *   `id_orden` (Relación obligatoria - Obligatorio)
    *   `numero_version` (Contador incremental de cambios - Obligatorio)
    *   `total_servicios` (Suma de ítems tipo servicio - Obligatorio)
    *   `total_repuestos` (Suma de ítems tipo repuesto - Obligatorio)
    *   `total_general` (Suma de servicios + repuestos - Obligatorio)
    *   `estado_estimacion` (Valores: BORRADOR, ENVIADO, PROCESADO - Obligatorio)
    *   `fecha_creacion` (Obligatorio)
*   **Identificador de negocio candidato**: Clave compuesta (`id_orden`, `numero_version`).

---

## 5. Relaciones
*   **Cliente — Vehículo**: Un **Cliente** puede registrar uno o muchos **Vehículos** en el sistema. Cada **Vehículo** pertenece obligatoriamente a exactamente un **Cliente** activo.
*   **Vehículo — Orden de Servicio**: Un **Vehículo** puede tener registradas cero o muchas **Órdenes de Servicio** en su historial técnico. Cada **Orden de Servicio** se emite para exactamente un **Vehículo** registrado.
*   **Orden de Servicio — Tarea de Orden**: Una **Orden de Servicio** puede subdividirse en una o muchas **Tareas Técnicas** individuales. Cada **Tarea de Orden** pertenece de manera estricta a una única **Orden de Servicio**.
*   **Orden de Servicio — Estimación**: Una **Orden de Servicio** puede asociar una o muchas versiones de **Estimación** a lo largo del flujo transaccional. Cada **Estimación** se genera y vincula para exactamente una única **Orden de Servicio**.
*   **Estimación — Ítem de Estimación**: Una **Estimación** agrupa uno o muchos **Ítems de Estimación** (repuestos o servicios individuales). Cada **Ítem de Estimación** forma parte obligatoria de exactamente una única versión de **Estimación**.
*   **Orden de Servicio — Evidencia**: Una **Orden de Servicio** puede tener asociadas cero o muchas **Evidencias** multimedia. Cada **Evidencia** documenta las condiciones físicas o técnicas de exactamente una única **Orden de Servicio**.
*   **Orden de Servicio — Historial de Estado**: Una **Orden de Servicio** registra una o muchas transiciones en su **Historial de Estado** para fines de auditoría. Cada registro del **Historial** corresponde a exactamente una única **Orden de Servicio**.
*   **Estimación — Aprobación de Cliente**: Una **Estimación** (en su versión definitiva) puede recibir cero o exactamente una decisión de **Aprobación de Cliente**. Cada **Aprobación de Cliente** se asocia y valida a exactamente una única versión de **Estimación**.

---

## 6. Cardinalidades

| Relación (A — B) | Cardinalidad | Participación Mínima (A / B) | Justificación de Negocio |
| :--- | :--- | :--- | :--- |
| **Cliente — Vehiculo** | 1:N | 1 — 0 | Un cliente puede registrarse antes de ingresar su primer vehículo, pero un vehículo no puede crearse en el sistema "huérfano" sin un propietario activo asignado (RN-01). |
| **Vehiculo — OrdenServicio** | 1:N | 1 — 0 | Un vehículo puede registrarse en el sistema como activo preventivo sin órdenes de servicio vigentes. Una orden de servicio requiere obligatoriamente un vehículo objetivo. |
| **OrdenServicio — TareaOrden** | 1:N | 1 — 1 | Toda orden de servicio que ingrese al taller debe contar con al menos una tarea técnica inicial (diagnóstico o mantenimiento parametrizado) para procesarse. |
| **OrdenServicio — Estimacion** | 1:N | 1 — 1 | Para avanzar en el taller se debe generar por lo menos una estimación preliminar. Si los costos cambian, surgirán nuevas versiones en una relación 1 a muchos (RN-04). |
| **Estimacion — ItemEstimacion** | 1:N | 1 — 1 | Toda estimación debe desglosarse de manera obligatoria en por lo menos un ítem monetizable (ya sea un repuesto técnico o una mano de obra del catálogo). |
| **OrdenServicio — Evidencia** | 1:N (0..*) | 1 — 0 | El taller puede procesar órdenes de servicio simples sin evidencias cargadas por los mecánicos, pero cada imagen/archivo guardado debe referenciar a su orden origen (RN-08). |
| **OrdenServicio — HistorialEstado** | 1:N | 1 — 1 | Al abrir la orden, se genera de manera automática el primer hito en el historial de transiciones (estado ABIERTA). Cada registro documenta un hito único. |
| **Estimacion — AprobacionCliente** | 1:0..1 | 1 — 0 | Una estimación en borrador no tiene aprobaciones. Una vez enviada al móvil, se puede registrar opcionalmente una única decisión (Aprobar o Rechazar) (RN-05). |

---

## 7. Reglas iniciales de integridad
*   **RI-01 (Obligatoriedad de Propietario)**: Todo `Vehiculo` debe estar estrictamente asociado a un `Cliente` activo registrado previamente en el sistema. (Garantiza el cumplimiento de **RN-01**).
*   **RI-02 (Dominio de Estados de Orden)**: El campo de estado de la `OrdenServicio` está estrictamente restringido a los valores de negocio: `ABIERTA`, `DIAGNOSTICO`, `ESPERA_APROBACION`, `EN_TRABAJO`, `LISTA_ENTREGA`, `ENTREGADA`, `CANCELADA`. No se permiten transiciones arbitrarias. (Garantiza el cumplimiento de **RN-02**).
*   **RI-03 (Unicidad de Orden Activa)**: Un `Vehiculo` puede tener como máximo una única `OrdenServicio` en un estado activo en paralelo (estados diferentes de `ENTREGADA` y `CANCELADA`). La apertura de una segunda orden activa para el mismo vehículo requiere el registro explícito del código de autorización de un Administrador. (Garantiza el cumplimiento de **RN-03**).
*   **RI-04 (Inmutabilidad de Estimaciones y Control de Versiones)**: Una `Estimacion` persistida en estado "Enviada" o "Aprobada/Rechazada" no puede ser modificada. Cualquier cambio en los repuestos, mano de obra o costos requiere la creación de un nuevo registro de `Estimacion` con `numero_version` incremental y estado "Borrador". (Garantiza el cumplimiento de **RN-04**).
*   **RI-05 (Integridad de la Aprobación Móvil)**: Toda `AprobacionCliente` debe registrar de forma mandatoria: identificador de la estimación versionada, decisión tomada (`APROBADO` o `RECHAZADO`), fecha/hora exacta y dirección IP o identificador del dispositivo móvil que emitió la acción. (Garantiza el cumplimiento de **RN-05**).
*   **RI-06 (Asignación Técnica Obligatoria)**: Cada `TareaOrden` debe registrar de manera mandatoria un identificador de técnico responsable asignado y su estado de ejecución (`ASIGNADA`, `EN_PROGRESO`, `COMPLETADA`). (Garantiza el cumplimiento de **RN-06**).
*   **RI-07 (Restricciones de Cierre y Criterio de Entrega)**: El sistema impedirá la transición de una `OrdenServicio` al estado `ENTREGADA` a menos que se validen concurrentemente las siguientes condiciones lógicas de negocio:
    1.  Todas las `TareaOrden` asociadas deben registrar el estado `COMPLETADA`.
    2.  Se debe capturar la fecha y hora de salida actual.
    3.  El `kilometraje_salida` debe registrarse obligatoriamente y debe ser matemáticamente mayor o igual al `kilometraje_ingreso` capturado en la recepción.
    4.  El campo `observaciones_salida` no puede estar vacío. (Garantiza el cumplimiento de **RN-07**).
*   **RI-08 (Evidencias Descriptivas)**: Cada registro de `Evidencia` debe estar vinculado a una `OrdenServicio` válida y contar con un atributo de descripción de texto no nulo que detalle el hallazgo mecánico evidenciado. (Garantiza el cumplimiento de **RN-08**).
*   **RI-09 (Unicidad Física de Activos)**: No se permite la inserción de registros de `Vehiculo` que dupliquen la placa o el número de VIN con otros registros preexistentes en la base de datos. (Garantiza el cumplimiento de **RF-15**).
*   **RI-10 (Trazabilidad Transaccional)**: Todo cambio de estado en `OrdenServicio`, `TareaOrden` o `Estimacion` debe registrar un hito histórico de auditoría capturando la marca de tiempo (TIMESTAMPTZ) y el usuario del sistema que realizó la operación. (Garantiza el cumplimiento de **RF-04**).

---

## 8. Dudas y decisiones
*   **D-01 (Múltiples Órdenes Activas)**: 
    *   *Duda*: ¿Cómo se registra y controla la "autorización administrativa" para romper la regla de una orden activa por vehículo?
    *   *Decisión*: Se ha incorporado a la entidad `OrdenServicio` un atributo opcional de negocio llamado `id_administrador_autoriza`. Si este atributo está presente, el sistema salta la validación del sistema y permite que coexistan dos órdenes abiertas para el mismo vehículo.
*   **D-02 (Almacenamiento de Evidencias Multimedia)**:
    *   *Duda*: ¿La base de datos PostgreSQL debe almacenar las imágenes/videos de evidencias como datos binarios (BLOB) o rutas externas?
    *   *Decisión*: Guardar archivos binarios directamente en el motor degrada el rendimiento del taller transaccional. Se decide almacenar las evidencias en un servicio de almacenamiento en la nube (ej. AWS S3) y persistir únicamente el metadato, tamaño, fecha de carga y la URL pública (TEXT/VARCHAR) de acceso en la entidad `Evidencia`.
*   **D-03 (Modelado de Actores frente a Usuarios)**:
    *   *Duda*: ¿Los roles de Administrador, Asesor y Técnico deben representarse como tablas independientes en la base de datos?
    *   *Decisión*: No. Para evitar redundancia de información de credenciales y autenticación, se modelará una entidad unificada `Usuario` con roles dinámicos asignados a través de una relación de seguridad. El `Cliente` sí se mantendrá en una tabla separada porque sus datos de negocio (dirección, relación de propiedad de activos, cuentas) son fundamentalmente diferentes a los datos laborales de los usuarios del taller.

---

## 9. Trazabilidad inicial

Para garantizar el cumplimiento contractual del producto (**AutoCare 360**), se establece el siguiente mapa de relaciones directas entre los elementos modelados y la ficha del proyecto:

| Elemento del Modelo Conceptual | Regla de Negocio / Requisito Asociado | Propósito en el MVP / Flujo Crítico |
| :--- | :--- | :--- |
| **Cliente — Vehículo (1:N)** | RN-01, RF-15 | Asegura que ningún vehículo ingrese al taller sin un propietario responsable asociado e impide la duplicación de placas. |
| **OrdenServicio.estado** | RN-02, RF-16 | Controla las transiciones del Kanban web de los vehículos por los 7 estados obligatorios de servicio. |
| **OrdenServicio.id_admin_autoriza** | RN-03 | Soporta la excepción controlada de mantenimiento simultáneo de un vehículo por diferentes siniestros. |
| **Estimacion.version** | RN-04, RF-10 | Permite almacenar el histórico de cambios en la cotización de repuestos cuando surgen novedades en el desmontaje. |
| **AprobacionCliente** | RN-05, RF-17 | Registra de forma inmutable la firma y decisión digital del cliente desde la app móvil. |
| **TareaOrden.id_usuario_tecnico** | RN-06, RF-18 | Habilita la pantalla móvil del técnico: "Mis Tareas" y permite calcular cargas de trabajo en el taller. |
| **OrdenServicio (Atributos de Salida)** | RN-07, RF-12 | Bloquea la entrega del vehículo si existen tareas abiertas o si el kilometraje de salida es menor al registrado al ingresar. |
| **Evidencia** | RN-08, RF-19 | Sostiene las evidencias fotográficas que los técnicos adjuntan desde el móvil para justificar servicios o repuestos adicionales. |
| **HistorialEstadoOrden** | RF-04, RF-20 | Proporciona la auditoría completa de tiempos, responsables y flujo de estados extremo a extremo del vehículo. |
| **ServicioCatalogo** | RF-07 | Estructura los precios base del taller y agiliza la sugerencia probabilística mediante Spring AI (M). |

---

## 10. Pendientes para Clase 03
1.  **Transformación al Modelo Relacional**: Convertir el diagrama conceptual en tablas relacionales estructuradas en PostgreSQL.
2.  **Definición de Llaves Físicas**: Definir las Claves Primarias (`PK`) utilizando identificadores de tipo `BIGINT GENERATED ALWAYS AS IDENTITY` y llaves foráneas (`FK`) con las restricciones referenciales correctas.
3.  **Resolución de Relaciones Muchos a Muchos (N:M)**: Implementar la tabla asociativa física de `DetalleEstimacion` (Ítems) uniendo `Estimacion` y `ServicioCatalogo`/Repuestos con control de precio unitario snapshot histórico.
4.  **Acciones ON DELETE**: Definir políticas de integridad referencial conscientes (`RESTRICT` para catálogos, `CASCADE` únicamente para elementos estrictamente subordinados como ítems de estimación o evidencias físicas).
5.  **Creación del Diccionario de Datos Inicial**: Especificar el tipo de datos físico idóneo (ej. `TIMESTAMPTZ` para marcas temporales, `NUMERIC(12,2)` para dinero y `VARCHAR` acotados lógicamente para cadenas estructuradas).
