# Alcance y Requisitos (Tablero de Control)

Este documento detalla el alcance funcional del sistema Tablero de Control y establece los requisitos que deben cumplirse para garantizar la operatividad, seguridad y rendimiento del SaaS.

## 1. Definición de Alcance

El sistema es un **SaaS Multi-tenant** de gestión de tareas y operaciones, diseñado para organizaciones con múltiples sedes, sectores o áreas de trabajo.

### 1.1 Funcionalidades Implementadas
- **Multi-tenancia**: Aislamiento completo de datos entre diferentes Negocios (Businesses).
- **Jerarquía Organizacional**: Gestión de Locales (Sedes) y Equipos dentro de cada negocio.
- **Gestión de Tareas (Kanban)**: Interfaz interactiva para el ciclo de vida de tareas (Backlog → Done).
- **Control de Acceso (RBAC)**: Sistema de 5 roles predefinidos con permisos jerárquicos + roles custom por negocio.
- **Colaboración Operativa**:
  - Comentarios en hilos por tarea con menciones `@usuario` y notificaciones
  - Checklists inline con barra de progreso
  - Subtareas jerárquicas (tareas con `parentId`)
- **Planificación**:
  - Ciclos / Períodos de trabajo (planning/active/completed/closed)
  - Objetivos / Iniciativas con progreso visual y fecha objetivo
  - Múltiples tableros (boards) por negocio
- **Vistas**:
  - Tablero Kanban con filtros avanzados
  - Calendario (FullCalendar)
  - Cronograma / Gantt (timeline con barras por tarea)
- **Registro de Tiempos**: Logs de horas por tarea con progreso vs estimado
- **Auditoría**: Registro de acciones críticas realizadas por los usuarios.
- **Suscripciones**: Gestión de planes y facturación vía MercadoPago.
- **Inteligencia Artificial**: Transcripción de audio a tareas y extracción desde texto libre (Groq).
- **Notificaciones**: Push (FCM), email (Resend) e in-app.

### 1.2 Fuera de Alcance (Futuro)
- Automatizaciones avanzadas (motor de reglas: "cuando X, hacer Y").
- Flujos de trabajo custom por tablero (estados configurables por negocio).
- Aplicaciones móviles nativas (iOS/Android) — se prioriza PWA/Web Responsive.
- Integraciones con terceros (ej. Slack, SAP).
- Videollamadas integradas.

---

## 2. Requisitos Funcionales (RF)

### 2.1 Gestión Organizacional
- **RF-001 (Multi-tenant)**: El sistema debe permitir que cada negocio gestione sus propios datos sin interferencia de otros.
- **RF-002 (Estructura)**: El administrador debe poder crear y editar Locales (Sedes) y Sectores/Equipos.
- **RF-003 (Roles)**: El sistema debe aplicar restricciones basadas en el rol del usuario (Superadmin, Admin, Responsable, Miembro, Viewer) y roles custom.

### 2.2 Gestión de Tareas (Core)
- **RF-004 (Tablero Kanban)**: Visualización de tareas en columnas según su estado.
- **RF-005 (Creación de Tareas)**: Permitir definir título, descripción, prioridad, tipo, fecha límite, asignación múltiple, tablero, ciclo y objetivo.
- **RF-006 (Asignación)**: Una tarea puede ser asignada a uno o varios miembros de un equipo.
- **RF-007 (Adjuntos)**: Soporte para subir archivos y fotos asociados a tareas (vía Cloudinary).
- **RF-008 (Comentarios)**: Hilo de conversación por cada tarea con menciones `@usuario`.
- **RF-009 (Checklists)**: Lista de pasos internos por tarea con progreso visual.
- **RF-010 (Subtareas)**: Tareas jerárquicas con asignación propia.
- **RF-011 (Time Tracking)**: Registro de horas trabajadas por tarea.

### 2.3 Planificación y Agrupación
- **RF-012 (Ciclos)**: Crear períodos de trabajo con fechas de inicio/fin y asignar tareas.
- **RF-013 (Objetivos)**: Crear iniciativas con color, fecha objetivo y agrupar tareas.
- **RF-014 (Tableros múltiples)**: Cada negocio puede tener múltiples tableros Kanban.

### 2.4 Vistas y Reportes
- **RF-015 (Calendario)**: Vista mensual/semanal de tareas.
- **RF-016 (Cronograma)**: Vista Gantt/timeline con barras por tarea agrupables.
- **RF-017 (Dashboard)**: KPIs de tareas, carga de trabajo y distribución.

### 2.5 Administración y Seguridad
- **RF-018 (Autenticación)**: Registro e inicio de sesión mediante Email/Password y Google OAuth (Firebase Auth).
- **RF-019 (Logs)**: Cada cambio crítico debe generar un log de auditoría.

---

## 3. Requisitos No Funcionales (RNF)

### 3.1 Rendimiento y Escalabilidad
- **RNF-001 (Latencia)**: Las operaciones del tablero Kanban deben procesarse en menos de 500ms al mover tareas entre columnas.
- **RNF-002 (Carga asíncrona)**: El uso de React Query debe garantizar que la interfaz no se bloquee durante la sincronización de datos.

### 3.2 Seguridad y Privacidad
- **RNF-003 (RBAC)**: Ningún usuario puede realizar acciones por encima de su nivel de jerarquía definido en `src/lib/constants/user.ts`.
- **RNF-004 (Persistencia)**: Los datos deben estar protegidos mediante reglas de seguridad de Firestore y políticas de acceso a nivel de API hacia PostgreSQL.

### 3.3 Portabilidad
- **RNF-005 (Backend Agnostic)**: El código debe seguir el patrón Repository para permitir el cambio de infraestructura (Firebase <-> PostgreSQL) con cambios mínimos.

---

## 4. Usuarios del Sistema
1. **Superadmin (TecnoFusión)**: Control de todos los negocios y el sistema global.
2. **Admin (Dueño Negocio)**: Configura locales, equipos, tableros, ciclos, objetivos y gestiona suscripciones.
3. **Responsable (Sede/Local)**: Supervisa tareas y equipos de una sede específica.
4. **Miembro (Operativo)**: Realiza tareas asignadas y registra horas.
5. **Viewer (Consultivo)**: Acceso de solo lectura a tableros y reportes.
