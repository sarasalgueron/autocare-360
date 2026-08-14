# AutoCare 360

Sistema académico full-stack para la gestión de un taller automotriz: clientes, vehículos, órdenes de servicio, tareas técnicas, estimaciones, evidencias y seguimiento hasta la entrega.

## 1. Problema

Actualmente el taller depende de formularios físicos para registrar clientes, vehículos, diagnósticos preliminares, órdenes de servicio, tareas, repuestos estimados, estados y entrega. Esto puede producir pérdida de trazabilidad, duplicidad de vehículos, estimaciones sin versionar y falta de visibilidad para el cliente sobre el avance de su vehículo.

## 2. Objetivo del MVP

Construir un sistema web y móvil que permita controlar el ciclo completo de una orden de servicio desde la recepción del vehículo hasta su entrega, con evidencias, responsables, estimaciones versionadas y trazabilidad completa.

## 3. Actores principales

- Administrador
- Asesor de servicio
- Técnico
- Cliente / propietario

## 4. Alcance inicial

- Clientes
- Vehículos
- Catálogo de servicios
- Órdenes de servicio
- Tareas técnicas
- Estimaciones
- Evidencias
- Estados y entregas
- Notificaciones
- Reportes

## 5. Fuera de alcance

- Integración con sistemas de pago reales
- Facturación fiscal
- GPS en tiempo real
- IA para decidir precios o autorizar órdenes automáticamente
- Diagnóstico automotriz automatizado

## 6. Stack objetivo del semestre

- Backend: Java 21 + Spring Boot
- Base de datos: PostgreSQL + migraciones (Flyway)
- Web: React + TypeScript
- Móvil: React Native + TypeScript
- Pruebas API: Postman / Bruno / Insomnia
- Contenedores: Docker / Docker Compose
- Versionado: Git + GitHub
- CI: GitHub Actions
- IA: Spring AI, únicamente como capacidad complementaria (sugerencia de tareas a partir de observaciones del asesor)

## 7. Estado actual

Etapa inicial: comprensión del problema, alcance, lenguaje inicial del dominio y backlog v0.1. Todavía no existe código de aplicación.

## 8. Documentación

- `docs/01-vision/vision-v0.1.md`
- `docs/01-vision/glossary-v0.1.md`
- `docs/02-requirements/backlog-v0.1.md`
- `docs/03-decisions/`

## 9. Regla de trabajo

Cada cambio importante debe ser comprensible, trazable y defendible. El repositorio es la fuente de verdad del proyecto.