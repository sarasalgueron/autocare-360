# AutoCare 360 — Modelo Relacional v0.1

Este documento presenta el diseño relacional inicial para **AutoCare 360**, un sistema para la gestión y seguimiento transaccional de órdenes de servicio en un taller automotriz multimarca. El diseño transforma las entidades núcleo identificadas en la Clase 02 en un esquema de tablas estructuradas con restricciones de integridad de datos que protegen las reglas del negocio.

---

## 1. Fuente
*   **Proyecto oficial:** AutoCare 360 (Taller Automotriz, Órdenes de Servicio y Seguimiento - PA-02) [1]
*   **Modelo conceptual base:** `model-conceptual-v0.1.md` (Entregable de la Clase 02)
*   **Flujo crítico utilizado:** 
    *   *Asesor abre orden* $\rightarrow$ *Técnico recibe tareas* $\rightarrow$ *Se genera estimación* $\rightarrow$ *Cliente aprueba desde móvil* $\rightarrow$ *Técnico actualiza trabajo* $\rightarrow$ *Asesor entrega vehículo* [15].

---

## 2. Criterios de Transformación
*   **Relaciones 1:N:** La clave foránea (`FK`) se coloca en la tabla correspondiente al lado "N" (muchos) de la relación, apuntando a la clave primaria (`PK`) del lado "1" (uno) [68].
*   **Relaciones N:M:** Se resuelven de forma relacional mediante tablas asociativas (o tablas puente) que contienen claves foráneas compuestas y, opcionalmente, atributos propios de la relación (p. ej., `tarea_orden` e `item_estimacion`) [70, 71].
*   **Optionalidad:** Se define la nulabilidad de las claves foráneas según sea conceptualmente obligatorio u opcional que un registro exista sin asociarse al otro [69].
*   **Claves naturales relevantes:** Se identifican las columnas con significado de negocio que deben ser únicas (p. ej., placa, VIN, número de documento, correo) y se protegen mediante restricciones de unicidad (`UNIQUE`) [62, 67].

---

## 3. Tablas Candidatas Núcleo

A continuación se detallan las tablas que forman parte del núcleo del negocio para soportar el flujo transaccional completo:

### `cliente`
*   **Propósito:** Representa a las personas naturales o jurídicas que son propietarias de los vehículos atendidos en el taller [5, 21].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico secuencial estroboscópico único.
    *   `nombre` VARCHAR(150) NOT NULL: Nombre completo o razón social del cliente.
    *   `tipo_documento` VARCHAR(20) NOT NULL: Tipo de documento de identidad (DNI, RUC, Pasaporte, etc.).
    *   `numero_documento` VARCHAR(20) NOT NULL: Número de documento de identidad único.
    *   `telefono` VARCHAR(20) NOT NULL: Número de contacto telefónico principal.
    *   `email` VARCHAR(254) NOT NULL: Correo electrónico de contacto único (formato estándar de longitud RFC 5321).
    *   `activo` BOOLEAN NOT NULL DEFAULT TRUE: Estado de habilitación del cliente (RN-01).
    *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(): Fecha y hora de registro en el sistema.
*   **Reglas relacionadas:** RF-05 [9], RF-15 [12], RN-01 [3].

### `vehiculo`
*   **Propósito:** Registra los automóviles asociados a cada cliente, los cuales ingresan al taller para recibir mantenimiento [3, 5].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico del vehículo.
    *   `cliente_id` [FK -> `cliente.id`] NOT NULL: Enlace obligatorio al cliente propietario (un vehículo no puede ser "huérfano") (RN-01).
    *   `placa` VARCHAR(15) NOT NULL: Placa metálica única de identificación del automóvil (clave natural).
    *   `vin` VARCHAR(17) NOT NULL: Número de Identificación Vehicular único de 17 caracteres (clave natural).
    *   `marca` VARCHAR(50) NOT NULL: Marca del fabricante (ej. Toyota, Ford).
    *   `modelo` VARCHAR(50) NOT NULL: Modelo específico (ej. Corolla, Mustang).
    *   `anio` INTEGER NOT NULL: Año de fabricación.
    *   `color` VARCHAR(30): Color exterior del automóvil (opcional).
    *   `kilometraje` INTEGER NOT NULL: Kilometraje actual acumulado del vehículo.
    *   `activo` BOOLEAN NOT NULL DEFAULT TRUE: Indica si el vehículo está en servicio activo.
    *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(): Fecha de alta del vehículo.
*   **Reglas relacionadas:** RF-06 [9], RF-15 [12], RN-01 [3].

### `usuario`
*   **Propósito:** Almacena la información de los usuarios internos del sistema (Administradores, Asesores de servicio, Técnicos) para gestionar accesos, responsabilidades y autorizaciones [2].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico del usuario.
    *   `username` VARCHAR(50) NOT NULL: Nombre de usuario único para inicio de sesión.
    *   `password_hash` VARCHAR(255) NOT NULL: Contraseña encriptada mediante algoritmo seguro (ej. BCrypt).
    *   `nombre` VARCHAR(150) NOT NULL: Nombre completo del trabajador.
    *   `rol` VARCHAR(30) NOT NULL: Rol del usuario en el taller. Valores válidos: `'ADMINISTRADOR'`, `'ASESOR'`, `'TECNICO'`.
    *   `activo` BOOLEAN NOT NULL DEFAULT TRUE: Estado del usuario.
*   **Reglas relacionadas:** RF-01 [8], RF-04 [9].

### `servicio_catalogo`
*   **Propósito:** Catálogo maestro de servicios, reparaciones estandarizadas y mantenimientos preventivos/correctivos que ofrece el taller [3, 6].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico del servicio catalogado.
    *   `codigo` VARCHAR(30) NOT NULL: Código único de servicio de negocio (ej. 'SERV-MANT-01') (clave natural).
    *   `nombre` VARCHAR(150) NOT NULL: Nombre comercial del servicio.
    *   `descripcion` TEXT: Detalle técnico del alcance del servicio (opcional).
    *   `precio_base` NUMERIC(12,2) NOT NULL: Precio de referencia base del servicio (sin impuestos).
    *   `activo` BOOLEAN NOT NULL DEFAULT TRUE: Indica si el servicio está disponible para ofrecerse.
*   **Reglas relacionadas:** RF-07 [10].

### `orden_servicio`
*   **Propósito:** Entidad transaccional central. Controla el ciclo completo de atención del vehículo en el taller, desde su ingreso hasta la salida definitiva [1, 6].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la orden de servicio.
    *   `vehiculo_id` [FK -> `vehiculo.id`] NOT NULL: Referencia obligatoria al vehículo objeto del servicio.
    *   `asesor_id` [FK -> `usuario.id`] NOT NULL: Referencia al Asesor de Servicio responsable de gestionar la orden.
    *   `numero_orden` VARCHAR(20) NOT NULL: Código único transaccional de negocio (ej. 'OS-2026-0001').
    *   `fecha_apertura` TIMESTAMPTZ NOT NULL DEFAULT now(): Registro temporal de ingreso al taller.
    *   `estado` VARCHAR(30) NOT NULL DEFAULT 'ABIERTA': Estado actual del flujo de trabajo taller (RN-02).
    *   `kilometraje_ingreso` INTEGER NOT NULL: Kilometraje registrado al momento de la recepción del vehículo.
    *   `observaciones_recepcion` TEXT: Reporte inicial del asesor sobre daños o solicitudes del cliente.
    *   `fecha_entrega` TIMESTAMPTZ: Fecha de entrega definitiva (requerido para estado 'ENTREGADA') (RN-07).
    *   `kilometraje_salida` INTEGER: Kilometraje al momento de la entrega (requerido para estado 'ENTREGADA') (RN-07).
    *   `observaciones_entrega` TEXT: Comentarios de salida registrados en la entrega (RN-07).
    *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(): Registro temporal de inserción.
*   **Reglas relacionadas:** RF-08 [10], RF-12 [11], RF-16 [13], RN-02 [3], RN-03 [4], RN-07 [4].

### `tarea_orden`
*   **Propósito:** Sub-elemento técnico (tabla asociativa con atributos) que detalla los trabajos específicos a realizar dentro de una orden de servicio. Representa la intersección N:M entre `orden_servicio` y `servicio_catalogo` [4, 6].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la tarea técnica.
    *   `orden_servicio_id` [FK -> `orden_servicio.id`] NOT NULL: Referencia obligatoria a la orden padre (RN-06).
    *   `servicio_catalogo_id` [FK -> `servicio_catalogo.id`] NOT NULL: Referencia obligatoria al servicio que se está ejecutando.
    *   `tecnico_id` [FK -> `usuario.id`]: Técnico asignado a la ejecución de la tarea (puede ser nulo inicialmente en diagnóstico).
    *   `descripcion_trabajo` TEXT: Notas específicas del trabajo a realizar o hallazgos.
    *   `estado` VARCHAR(30) NOT NULL DEFAULT 'ASIGNADA': Estado actual de la tarea (RN-06). Valores: `'ASIGNADA'`, `'EN_PROGRESO'`, `'COMPLETADA'`, `'CANCELADA'`.
    *   `obligatoria` BOOLEAN NOT NULL DEFAULT TRUE: Flag que define si la tarea es de cierre mandatorio para poder entregar el vehículo (RN-07).
    *   `created_at` TIMESTAMPTZ NOT NULL DEFAULT now(): Registro de asignación temporal.
*   **Reglas relacionadas:** RF-09 [10], RF-18 [13], RN-06 [4], RN-07 [4].

### `estimacion`
*   **Propósito:** Presupuesto de repuestos, insumos y mano de obra propuesto por el taller para la aprobación formal del cliente. Soporta versionado histórico obligatorio [4, 6].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la estimación.
    *   `orden_servicio_id` [FK -> `orden_servicio.id`] NOT NULL: Orden de servicio asociada a la estimación.
    *   `version` INTEGER NOT NULL DEFAULT 1: Número de versión de la estimación (RN-04).
    *   `fecha_creacion` TIMESTAMPTZ NOT NULL DEFAULT now(): Fecha en que se elaboró esta versión del presupuesto.
    *   `total_estimado` NUMERIC(12,2) NOT NULL DEFAULT 0.00: Costo total sumado de todos sus ítems componentes (dato derivado persistido para trazabilidad histórica).
    *   `activo` BOOLEAN NOT NULL DEFAULT TRUE: Indica si esta versión es la vigente para negociación.
*   **Reglas relacionadas:** RF-10 [11], RN-04 [4].

### `item_estimacion`
*   **Propósito:** Detalle individualizado de los insumos, repuestos y mano de obra cotizados dentro de una estimación. Representa la composición subordinada (1:N fuerte) de `estimacion` [7].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico del ítem.
    *   `estimacion_id` [FK -> `estimacion.id`] NOT NULL: Referencia obligatoria a la estimación padre.
    *   `servicio_catalogo_id` [FK -> `servicio_catalogo.id`]: Referencia opcional al catálogo (en caso de que el ítem sea un repuesto o concepto especial no catalogado).
    *   `tipo` VARCHAR(20) NOT NULL: Tipo de ítem. Valores: `'REPUESTO'`, `'MANO_OBRA'`.
    *   `descripcion` VARCHAR(200) NOT NULL: Descripción textual del repuesto o servicio.
    *   `cantidad` INTEGER NOT NULL: Cantidad física o de horas cotizadas.
    *   `precio_unitario` NUMERIC(12,2) NOT NULL: Precio unitario pactado para este ítem (snapshot congelado en el tiempo) [122].
    *   `subtotal` NUMERIC(12,2) NOT NULL: Cálculo de `cantidad * precio_unitario` persistido para auditoría y congelación.
*   **Reglas relacionadas:** RF-10 [11].

### `aprobacion_cliente`
*   **Propósito:** Registra formalmente la decisión tomada por el cliente (aprobación/rechazo) respecto a una versión específica de la estimación, con validez jurídica y de auditoría [4, 7].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la aprobación.
    *   `estimacion_id` [FK -> `estimacion.id`] NOT NULL: Referencia obligatoria a la versión exacta de la estimación que se evalúa.
    *   `decision` VARCHAR(20) NOT NULL: Decisión del cliente. Valores: `'APROBADA'`, `'RECHAZADA'`.
    *   `fecha_decision` TIMESTAMPTZ NOT NULL DEFAULT now(): Registro temporal de la decisión (RN-05).
    *   `comentario` TEXT: Notas aclaratorias del cliente sobre su decisión (p. ej., por qué rechazó un ítem).
    *   `firma_digital_url` VARCHAR(500): Enlace opcional a la firma electrónica o token de confirmación (si aplica en la app móvil) [14].
*   **Reglas relacionadas:** RF-17 [13], RN-05 [4].

### `evidencia`
*   **Propósito:** Soporte multimedia (fotos, videos, diagnósticos escaneados) adjunto a la orden de servicio para transparentar el estado del vehículo [4, 7].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador de la evidencia.
    *   `orden_servicio_id` [FK -> `orden_servicio.id`] NOT NULL: Orden de servicio vinculada obligatoriamente (RN-08).
    *   `subido_por_id` [FK -> `usuario.id`] NOT NULL: Trabajador responsable que capturó y cargó el archivo al sistema.
    *   `url_archivo` VARCHAR(500) NOT NULL: URL del almacenamiento de objetos de la nube (ej. AWS S3) donde reside el archivo.
    *   `tipo_archivo` VARCHAR(50) NOT NULL: MIME type de la evidencia (ej. 'image/jpeg', 'image/png', 'video/mp4').
    *   `descripcion` TEXT NOT NULL: Explicación textual del hallazgo fotografiado (RN-08).
    *   `fecha_subida` TIMESTAMPTZ NOT NULL DEFAULT now(): Registro de fecha y hora de la carga del archivo.
*   **Reglas relacionadas:** RF-11 [11], RF-19 [13], RN-08 [4].

### `historial_estado_orden`
*   **Propósito:** Bitácora histórica inmutable para fines de auditoría y análisis de rendimiento de tiempos de atención (KPIs) en el taller. Registra cronológicamente cada cambio de estado [7].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la transición.
    *   `orden_servicio_id` [FK -> `orden_servicio.id`] NOT NULL: Orden cuya transición se está logueando.
    *   `usuario_id` [FK -> `usuario.id`] NOT NULL: Usuario del sistema (Asesor o Técnico) que ejecutó la transición de estado (RF-04).
    *   `estado_anterior` VARCHAR(30): Estado en el que se encontraba la orden antes del cambio (NULL para la creación).
    *   `estado_nuevo` VARCHAR(30) NOT NULL: Estado al que transitó la orden.
    *   `fecha_cambio` TIMESTAMPTZ NOT NULL DEFAULT now(): Instante exacto del cambio de estado.
    *   `comentario` TEXT: Justificación u observaciones asociadas al cambio de estado.
*   **Reglas relacionadas:** RF-04 [9], RF-12 [11], RF-20 [13].

### `notificacion`
*   **Propósito:** Cola de mensajes enviados automáticamente al cliente propietario para avisarle sobre eventos clave de su vehículo [8].
*   **Atributos:**
    *   `id` [PK] BIGINT GENERATED ALWAYS AS IDENTITY: Identificador técnico de la notificación.
    *   `cliente_id` [FK -> `cliente.id`] NOT NULL: Propietario destinatario de la notificación.
    *   `orden_servicio_id` [FK -> `orden_servicio.id`]: Orden de servicio origen del evento.
    *   `tipo` VARCHAR(50) NOT NULL: Canal utilizado. Valores: `'CORREO'`, `'SMS'`, `'PUSH_MOBILE'`.
    *   `mensaje` TEXT NOT NULL: Cuerpo textual del aviso enviado.
    *   `enviado_at` TIMESTAMPTZ NOT NULL DEFAULT now(): Fecha y hora en la que se despachó el mensaje.
    *   `leido` BOOLEAN NOT NULL DEFAULT FALSE: Flag de lectura móvil.
*   **Reglas relacionadas:** RF-13 [12].

---

## 4. Relaciones (1:N)

*   **`cliente` 1:N `vehiculo`**
    *   *Frase:* Un **Cliente** puede registrar uno o muchos **Vehículos** [3]; cada **Vehículo** pertenece obligatoriamente a un único **Cliente** activo [3].
    *   *Clave foránea:* `vehiculo.cliente_id` $\rightarrow$ `cliente.id`.
    *   *Sustento:* RN-01 ("Cada vehículo debe asociarse a un propietario activo") [3].
*   **`vehiculo` 1:N `orden_servicio`**
    *   *Frase:* Un **Vehículo** puede registrar una o muchas **Órdenes de Servicio** en su historial; cada **Orden de Servicio** se asocia a exactamente un **Vehículo** [3].
    *   *Clave foránea:* `orden_servicio.vehiculo_id` $\rightarrow$ `vehiculo.id`.
    *   *Sustento:* RF-08 ("Módulo de órdenes de servicio") [10].
*   **`orden_servicio` 1:N `estimacion`**
    *   *Frase:* Una **Orden de Servicio** puede tener una o muchas **Estimaciones** (versiones históricas) [4]; cada **Estimación** pertenece a una única **Orden de Servicio** [6].
    *   *Clave foránea:* `estimacion.orden_servicio_id` $\rightarrow$ `orden_servicio.id`.
    *   *Sustento:* RN-04 ("Toda estimación debe versionarse") [4].
*   **`estimacion` 1:N `item_estimacion`**
    *   *Frase:* Una **Estimación** se compone de uno o muchos **Ítems de Estimación** [7]; cada **Ítem** está adscrito obligatoriamente a una única **Estimación** [7].
    *   *Clave foránea:* `item_estimacion.estimacion_id` $\rightarrow$ `estimacion.id` (con acción `ON DELETE CASCADE`).
    *   *Sustento:* RF-10 ("Persistir ítems cotizados") [11].
*   **`orden_servicio` 1:N `evidencia`**
    *   *Frase:* Una **Orden de Servicio** puede documentar cero o muchas **Evidencias** [4]; cada **Evidencia** pertenece a una única **Orden de Servicio** [4].
    *   *Clave foránea:* `evidencia.orden_servicio_id` $\rightarrow$ `orden_servicio.id`.
    *   *Sustento:* RN-08 ("Las evidencias adjuntas deben asociarse a la orden") [4].
*   **`orden_servicio` 1:N `historial_estado_orden`**
    *   *Frase:* Una **Orden de Servicio** acumula uno o muchos cambios en su **Historial de Estado** [7]; cada registro de historial documenta la transición de una única **Orden** [7].
    *   *Clave foránea:* `historial_estado_orden.orden_servicio_id` $\rightarrow$ `orden_servicio.id`.
    *   *Sustento:* RF-04, RF-12, RF-20 [9, 11, 13].
*   **`cliente` 1:N `notificacion`**
    *   *Frase:* Un **Cliente** recibe cero o muchas **Notificaciones** [8]; cada **Notificación** va dirigida a un único **Cliente** destinatario [8].
    *   *Clave foránea:* `notificacion.cliente_id` $\rightarrow$ `cliente.id`.
    *   *Sustento:* RF-13 [12].

---

## 5. Relaciones N:M (Resueltas mediante tablas puente)

*   **`orden_servicio` N:M `servicio_catalogo` $\rightarrow$ `tarea_orden`**
    *   *Propósito:* Una orden de servicio abarca múltiples tipos de servicios técnicos de catálogo, y un servicio específico del catálogo puede ser asignado en múltiples órdenes a lo largo del tiempo.
    *   *Resolución:* Se resuelve con la tabla intermedia **`tarea_orden`** [6].
    *   *Atributos de la relación:* `tecnico_id` (Técnico asignado), `descripcion_trabajo`, `estado` (ej. ASIGNADA, COMPLETADA), `obligatoria` (flag para control de cierre de la orden) [4, 6].
    *   *Sustento:* RN-06 ("Las tareas deben tener responsable y estado") [4] y RN-07 ("La entrega requiere cerrar tareas obligatorias") [4].

*   **`estimacion` N:M `servicio_catalogo` $\rightarrow$ `item_estimacion`**
    *   *Propósito:* Una estimación presupuesta múltiples servicios del catálogo, y un servicio de catálogo puede aparecer cotizado en múltiples estimaciones.
    *   *Resolución:* Se resuelve con la tabla intermedia **`item_estimacion`** [7].
    *   *Atributos de la relación:* `cantidad`, `precio_unitario` (snapshot temporal congelado), `tipo` (repuesto o mano de obra), `descripcion` (permite ingresar repuestos manuales adicionales) [122].
    *   *Sustento:* RF-10 [11].

---

## 6. Claves Naturales e Índices UNIQUE Candidatos

Para resguardar la unicidad semántica del negocio, se proponen las siguientes restricciones `UNIQUE` (adicionales a las claves primarias sustitutas):

1.  **`cliente.numero_documento`**: Garantiza que no se registren dos clientes con la misma identificación legal (DNI/RUC) en el sistema.
2.  **`cliente.email`**: Evita la duplicidad de cuentas de correo electrónico, indispensable para la seguridad y el inicio de sesión web/móvil [12].
3.  **`vehiculo.placa`**: Asegura que una placa vehicular no se repita en el sistema, cumpliendo estrictamente con el criterio de aceptación y regla funcional de la ficha [12, 17].
4.  **`vehiculo.vin`**: El Número de Identificación Vehicular (VIN) es único a nivel mundial para cada coche, por lo que se exige unicidad a nivel de esquema [12, 17].
5.  **`usuario.username`**: Impide que dos empleados del taller compartan el mismo login de acceso a la aplicación.
6.  **`servicio_catalogo.codigo`**: Clave de negocio estandarizada para codificar de forma inconfundible cada servicio (p. ej., 'SERV-MANT-05').
7.  **`orden_servicio.numero_orden`**: Código alfanumérico secuencial visible para el cliente (ej. 'OS-2026-0034'), el cual debe ser único a nivel de sistema para búsquedas en la app móvil.
8.  **`estimacion(orden_servicio_id, version)` [Compuesto UNIQUE]**: Exige que para una misma orden de servicio, el número de versión presupuestaria (`version`) sea único, impidiendo duplicar versiones del mismo análisis (RN-04) [4].
9.  **`aprobacion_cliente.estimacion_id`**: Restringe que para una versión exacta de estimación exista únicamente una decisión de aprobación o rechazo (relación transaccional 1:1 o 0..1) [4, 7].

---

## 7. Optionalidad de Claves Foráneas (`FK`)

A continuación se registra el análisis de optionalidad conceptual de cada clave foránea definida:

| Tabla | Atributo FK | Referencia a | Tipo | Justificación conceptual de negocio |
| :--- | :--- | :--- | :--- | :--- |
| `vehiculo` | `cliente_id` | `cliente.id` | **Obligatoria** | Un vehículo debe tener obligatoriamente un propietario activo para poder ser registrado en el taller y abrirle órdenes (RN-01) [3]. |
| `orden_servicio` | `vehiculo_id` | `vehiculo.id` | **Obligatoria** | Una orden de servicio existe con el único fin de atender a un vehículo concreto que se encuentra en las instalaciones. |
| `orden_servicio` | `asesor_id` | `usuario.id` | **Obligatoria** | Toda orden de servicio debe ser abierta por un Asesor de Servicio responsable, quien recibe físicamente el vehículo y realiza la inspección inicial [2]. |
| `tarea_orden` | `orden_servicio_id` | `orden_servicio.id` | **Obligatoria** | Las tareas técnicas no existen de forma independiente; solo tienen sentido dentro del alcance de una orden abierta [70]. |
| `tarea_orden` | `servicio_catalogo_id` | `servicio_catalogo.id` | **Obligatoria** | Cada tarea técnica debe basarse en un servicio real predefinido en el catálogo del taller para poder tarifarse y controlarse. |
| `tarea_orden` | `tecnico_id` | `usuario.id` | **Opcional** | Al abrir una orden, las tareas pueden no tener un técnico asignado de forma inmediata (pasan por fase de diagnóstico preliminar) [15]. |
| `estimacion` | `orden_servicio_id` | `orden_servicio.id` | **Obligatoria** | Una estimación (y sus versiones) está ligada íntimamente a una orden de servicio donde se detallan las fallas encontradas. |
| `item_estimacion` | `estimacion_id` | `estimacion.id` | **Obligatoria** | Un ítem cotizado (p. ej., un repuesto) no puede existir sin un documento de estimación que lo agrupe y le dé validez legal. |
| `item_estimacion` | `servicio_catalogo_id` | `servicio_catalogo.id` | **Opcional** | Permite registrar en el presupuesto repuestos o insumos manuales, específicos o extraordinarios que no formen parte del catálogo regular de servicios. |
| `aprobacion_cliente` | `estimacion_id` | `estimacion.id` | **Obligatoria** | La aprobación o rechazo de un cliente requiere asociarse estrictamente a una versión específica de la estimación para evitar confusiones de costos [4]. |
| `evidencia` | `orden_servicio_id` | `orden_servicio.id` | **Obligatoria** | Toda evidencia multimedia capturada en el taller (fotos de piezas rotas o video de fallas) debe ligarse de forma unívoca a la orden de servicio activa (RN-08) [4]. |
| `evidencia` | `subido_por_id` | `usuario.id` | **Obligatoria** | Para control de auditoría del taller, se debe conocer la identidad exacta del colaborador (asesor o técnico) que cargó el archivo al sistema. |
| `historial_estado_orden` | `orden_servicio_id` | `orden_servicio.id` | **Obligatoria** | Un registro de log o bitácora de auditoría inmutable debe pertenecer siempre a la orden de servicio monitoreada. |
| `historial_estado_orden` | `usuario_id` | `usuario.id` | **Obligatoria** | Cada transición de estado debe llevar la firma digital del usuario interno responsable que autorizó el cambio de fase de negocio (RF-04) [9]. |
| `notificacion` | `cliente_id` | `cliente.id` | **Obligatoria** | Una notificación debe tener un destinatario claro (el cliente propietario) para poder ser enviada a su correo, SMS o app push [14]. |
| `notificacion` | `orden_servicio_id` | `orden_servicio.id` | **Opcional** | Aunque la mayoría de notificaciones nacen de eventos en órdenes de servicio, pueden existir mensajes directos de marketing o avisos generales de cuenta que no se liguen a una orden. |

---

## 8. Reglas de Integridad Estructurales (RI)

Estas condiciones lógicas se implementarán a nivel de esquema de base de datos para proteger la coherencia estructural de los datos, traduciendo directamente las reglas de negocio de la ficha de AutoCare:

*   **`RI-01` (Coexistencia y Estado Activo):** La clave foránea `vehiculo.cliente_id` debe apuntar obligatoriamente a un cliente que tenga la bandera `activo = TRUE` al momento de la inserción, garantizando la consistencia de la regla **RN-01** [3].
*   **`RI-02` (Restricción de Estados de Orden):** La columna `orden_servicio.estado` debe restringirse únicamente a los siguientes valores literales: `'ABIERTA'`, `'DIAGNOSTICO'`, `'ESPERA_APROBACION'`, `'EN_TRABAJO'`, `'LISTA_ENTREGA'`, `'ENTREGADA'`, `'CANCELADA'`. Esto se implementará mediante una restricción `CHECK` o un tipo enumerado, protegiendo la regla **RN-02** [3].
*   **`RI-03` (Integridad del Kilometraje):** El kilometraje no puede ser decreciente. Se debe cumplir que:
    *   `vehiculo.kilometraje >= 0`
    *   `orden_servicio.kilometraje_ingreso >= vehiculo.kilometraje` (al ingresar)
    *   `orden_servicio.kilometraje_salida >= orden_servicio.kilometraje_ingreso` (al entregar - RN-07) [4].
*   **`RI-04` (Unicidad Compuesta de Versión):** Se debe declarar un índice `UNIQUE(orden_servicio_id, version)` en la tabla `estimacion` para evitar que colisionen dos versiones con el mismo correlativo dentro del contexto de una única orden, protegiendo la regla **RN-04** [4].
*   **`RI-05` (Inmutabilidad de la Aprobación):** Una vez que un registro se inserta en `aprobacion_cliente` para un `estimacion_id` dado, no se permiten modificaciones en la decisión (`decision`) ni en la fecha para salvaguardar la firma digital y evitar el repudio de la transacción (cumpliendo con **RN-05**) [4].
*   **`RI-06` (Asignación Técnica):** Si `tarea_orden.estado` pasa a `'EN_PROGRESO'` o `'COMPLETADA'`, la columna `tecnico_id` no puede ser nula (`NOT NULL`), asegurando que toda tarea activa tenga siempre un responsable asignado de manera obligatoria (**RN-06**) [4].
*   **`RI-07` (Control de Cierre para Entrega):** Al realizar la transición de `orden_servicio.estado` a `'ENTREGADA'`:
    *   Las columnas `fecha_entrega`, `kilometraje_salida` y `observaciones_entrega` deben ser obligatoriamente `NOT NULL` (**RN-07**) [4].
    *   Se debe comprobar mediante un trigger de base de datos o lógica robusta de backend que todas las tareas marcadas como `obligatoria = TRUE` pertenecientes a la orden tengan el estado `'COMPLETADA'` (**RN-07**) [4].
*   **`RI-08` (Descripción Obligatoria de Evidencia):** La columna `evidencia.descripcion` debe ser `NOT NULL` y contener un mínimo de 10 caracteres válidos de descripción para asegurar que no se suban archivos vacíos o mudos al sistema (**RN-08**) [4].
*   **`RI-09` (Precios No Negativos):** Los campos `servicio_catalogo.precio_base`, `item_estimacion.precio_unitario` e `item_estimacion.subtotal` deben ser estrictamente superiores o iguales a cero mediante restricciones `CHECK` (`>= 0.00`) [121].
*   **`RI-10` (Trazabilidad Temporal):** Todas las tablas transaccionales (`orden_servicio`, `tarea_orden`, `estimacion`, `aprobacion_cliente`, `evidencia`, `historial_estado_orden`) deben registrar de forma automática y obligatoria sus marcas de tiempo mediante el tipo `TIMESTAMPTZ` y valores por defecto `now()` de PostgreSQL [113, 116].

---

## 9. Decisiones de Diseño y Dudas por Resolver

1.  **¿Borrado Físico o Lógico?:** Se ha decidido optar por **borrado lógico** (`activo = FALSE`) para las entidades maestras `cliente`, `vehiculo` y `servicio_catalogo` para no romper la integridad de las órdenes de servicio históricas de los clientes [128]. Para las tablas transaccionales y de detalle como `item_estimacion`, se utilizará **borrado físico en cascada** (`ON DELETE CASCADE`) solo cuando se modifique un borrador de estimación no aprobado [117, 121].
2.  **Manejo de Versiones en Estimación:** Al crearse una nueva versión de la estimación (p. ej., versión 2), se desactivarán las versiones anteriores (`activo = FALSE`) [4]. Solo una versión de estimación puede tener `activo = TRUE` a la vez por orden de servicio.
3.  **Duda por resolver con el cliente/docente:** ¿Se requiere que la firma digital de aprobación del cliente guardada en `aprobacion_cliente` sea un hash criptográfico de backend o basta con guardar la imagen S3 de la firma dibujada en la app móvil? Por el momento, se ha dejado una columna de URL (`firma_digital_url`) para almacenar la firma visual dibujada.

---

## 10. Revisión de Normalización Básica (Cumplimiento de Leyes de Normalización)

*   **1FN (Primera Forma Normal - Atomicidad):** Se eliminaron todas las listas multivaluadas [105]. Por ejemplo:
    *   La lista de repuestos y servicios cotizados que antes podía plantearse como un campo de texto o array separado por comas dentro de la estimación se ha extraído formalmente a la tabla hija `item_estimacion`, donde cada fila representa un solo valor atómico [105].
    *   Se eliminaron las columnas repetitivas de contacto, manejando un único atributo principal por cliente (`telefono` y `email` como registros únicos) [105].
*   **2FN (Segunda Forma Normal - Dependencia Funcional Completa):**
    *   En las tablas asociativas con claves compuestas implícitas, como `tarea_orden` o `item_estimacion`, todos los atributos no clave dependen del conjunto completo de claves lógicas [106].
    *   Por ejemplo, en `item_estimacion`, la `cantidad` y el `precio_unitario` aplicado dependen de la combinación de la estimación concreta y el artículo cotizado, no de manera aislada de uno de ellos [106].
*   **3FN (Tercera Forma Normal - No Dependencia Transitiva):**
    *   Se eliminó la redundancia de datos de cliente dentro de la orden de servicio [107]. La orden de servicio solo almacena `vehiculo_id` [112]. A través de esta relación, se navega al vehículo y de ahí al cliente, evitando almacenar redundancias como el nombre del cliente o teléfono directamente en la orden de servicio (lo que provocaría anomalías de actualización ante un cambio de datos del cliente) [104, 107].
    *   Se almacena de forma justificada el `precio_unitario` en `item_estimacion` para congelar el valor de la transacción al momento de la aprobación del cliente, lo cual no es una redundancia indebida, sino un patrón de diseño histórico correcto para prevenir que futuros cambios en los precios del catálogo alteren de manera retroactiva los montos de facturas o cotizaciones pasadas [122].

---

## 11. Pendientes para la Clase 04
1.  **Definir el DER lógico visual completo** utilizando una herramienta CASE (Mermaid o similar) para integrarlo en la documentación visual [82, 147].
2.  **Construir el Diccionario de Datos Físico definitivo**, donde se definirán formalmente los tipos de datos de PostgreSQL (p. ej., `BIGINT`, `TIMESTAMPTZ`, `NUMERIC(12,2)`, `BOOLEAN`) [82, 113, 126].
3.  **Establecer las políticas de `ON DELETE` y `ON UPDATE` físicas** para cada clave foránea en la base de datos (p. ej., `ON DELETE RESTRICT` para evitar borrar vehículos con órdenes activas) [82, 116, 117].
