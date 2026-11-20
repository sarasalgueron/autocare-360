# Glosario v0.1 — AutoCare 360

| Término | Significado inicial |
|---|---|
| Cliente | Persona propietaria de uno o más vehículos que utiliza los servicios del taller. |
| Vehículo | Vehículo registrado y asociado a un cliente activo, identificado por placa/VIN. |
| ServicioCatalogo | Servicio predefinido que el taller ofrece y que puede incluirse en una estimación u orden. |
| OrdenServicio | Registro que representa el ciclo de atención de un vehículo, desde su recepción hasta la entrega. |
| TareaOrden | Actividad técnica concreta dentro de una orden, con responsable y estado propio. |
| Estimacion | Cálculo de costos y alcance de una orden, versionado cada vez que cambian sus condiciones. |
| ItemEstimacion | Línea individual de una estimación (servicio o repuesto) con su costo asociado. |
| Evidencia | Archivo o registro adjunto a la orden (foto, documento) con una descripción obligatoria. |
| HistorialEstadoOrden | Registro histórico de los cambios de estado que atraviesa una orden. |
| AprobacionCliente | Registro de la decisión del cliente (aprobar/rechazar) sobre una estimación, con fecha. |
| Notificacion | Aviso enviado al cliente o a un actor interno sobre un evento relevante de la orden. |
| Diagnóstico | Evaluación preliminar del vehículo que da origen o ajusta la orden de servicio. |
| Estado de orden | Situación actual de una orden dentro del flujo definido (ABIERTA, DIAGNOSTICO, ESPERA_APROBACION, EN_TRABAJO, LISTA_ENTREGA, ENTREGADA, CANCELADA). |

> Este glosario es v0.1. Los significados pueden refinarse cuando aparezcan nuevas reglas, pero los cambios deberán quedar documentados.