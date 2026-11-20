# Visión v0.1 — AutoCare 360

## 1. Contexto

Un taller multimarca necesita abandonar formularios físicos para registrar clientes, vehículos, diagnósticos preliminares, órdenes de servicio, tareas, repuestos estimados, estados y entrega. El cliente quiere seguimiento web interno y una app móvil para que el propietario consulte el avance.

## 2. Problema

La operación actual puede generar pérdida de trazabilidad de diagnósticos y tareas, estimaciones sin control de versiones cuando cambian costos o alcance, órdenes duplicadas para un mismo vehículo y falta de visibilidad para el cliente sobre el estado real de su vehículo.

## 3. Objetivo

Controlar el ciclo completo de una orden de servicio desde la recepción del vehículo hasta su entrega, con evidencias, responsables, estimaciones versionadas y trazabilidad, permitiendo que el cliente apruebe o rechace estimaciones desde su dispositivo móvil.

## 4. Actores

### Administrador
Configura catálogos, usuarios, parámetros y supervisa la operación completa.

### Asesor de servicio
Opera los procesos diarios habilitados para su función y registra información transaccional (recepción, apertura de órdenes, estimaciones, entrega).

### Técnico
Ejecuta el trabajo especializado asignado, actualiza estados y aporta evidencias/seguimiento de las tareas.

### Cliente / propietario
Usuario externo que consulta, solicita, aprueba o rechaza estimaciones, y realiza acciones de autoservicio autorizadas desde la app móvil.

## 5. Alcance del MVP

1. Gestión de clientes y vehículos (sin duplicar placa/VIN).
2. Catálogo de servicios.
3. Apertura y seguimiento de órdenes de servicio por estado.
4. Asignación y cierre de tareas técnicas.
5. Generación y versionado de estimaciones.
6. Aprobación o rechazo de estimaciones desde móvil.
7. Adjuntar evidencias asociadas a la orden.
8. Historial de estados de la orden.
9. Notificaciones al cliente.
10. Reportes e indicadores operativos básicos.

## 6. Exclusiones

No incluye pasarela de pago real, facturación fiscal, GPS en tiempo real, diagnóstico automotriz automatizado ni decisiones automáticas de negocio mediante IA (la IA solo sugiere tareas a partir de texto, con confirmación humana obligatoria).

## 7. Éxito inicial del proyecto

El proyecto será exitoso cuando pueda demostrar, con datos persistidos, el flujo completo: asesor abre orden → técnico recibe tareas → se genera estimación → cliente aprueba desde móvil → técnico actualiza trabajo → asesor entrega vehículo, consumido por web y móvil sobre el mismo backend.