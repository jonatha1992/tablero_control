# Alcance y Requisitos (Tablero de Control)

Este documento detalla el alcance funcional del MVP del sistema Tablero de Control y establece los requisitos que deben cumplirse para garantizar la operatividad, seguridad y rendimiento del SaaS.

## 1. Definición de Alcance (MVP)

El sistema es un **SaaS Multi-tenant** de gestión de tareas y operaciones, diseñado para organizaciones con múltiples sedes o sectores.

### 1.1 Incluido en el Alcance
- **Multi-tenancia**: Aislamiento completo de datos entre diferentes Negocios (Businesses).
- **Jerarquía Organizacional**: Gestión de Locales (Sedes) y Equipos dentro de cada negocio.
- **Gestión de Tareas (Kanban)**: Interfaz interactiva para el ciclo de vida de tareas (Backlog -> Done).
- **Control de Acceso (RBAC)**: Sistema de 5 roles predefinidos con permisos jerárquicos.
- **Colaboración**: Comentarios, archivos adjuntos y etiquetas por tarea.
- **Auditoría**: Registro de acciones críticas realizadas por los usuarios.
- **Suscripciones**: Gestión básica de planes y facturación.

### 1.2 Fuera de Alcance (Post-MVP)
- Automatizaciones avanzadas (flujos de trabajo configurables).
- Aplicaciones móviles nativas (iOS/Android) — se prioriza PWA/Web Responsive.
- Integraciones con terceros (ej. Slack, Jira, SAP).
- Videollamadas integradas.

---

## 2. Requisitos Funcionales (RF)

### 2.1 Gestión Organizacional
- **RF-001 (Multi-tenant)**: El sistema debe permitir que cada negocio gestione sus propios datos sin interferencia de otros.
- **RF-002 (Estructura)**: El administrador debe poder crear y editar Locales (Sedes) y Sectores/Equipos.
- **RF-003 (Roles)**: El sistema debe aplicar restricciones basadas en el rol del usuario (Superadmin, Admin, Responsable, Miembro, Viewer).

### 2.2 Gestión de Tareas (Core)
- **RF-004 (Tablero Kanban)**: Visualización de tareas en columnas según su estado.
- **RF-005 (Creación de Tareas)**: Permitir definir título, descripción, prioridad, tipo y fecha límite.
- **RF-006 (Asignación)**: Una tarea puede ser asignada a uno o varios miembros de un equipo.
- **RF-007 (Adjuntos)**: Soporte para subir archivos y fotos asociados a tareas (vía Cloudinary/Storage).
- **RF-008 (Comentarios)**: Hilo de conversación por cada tarea.

### 2.3 Administración y Seguridad
- **RF-009 (Autenticación)**: Registro e inicio de sesión mediante Email/Password y Google OAuth (Firebase Auth).
- **RF-010 (Logs)**: Cada cambio crítico (borrado de tareas, cambio de roles) debe generar un log de auditoría.

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
2. **Admin (Dueño Negocio)**: Configura locales, equipos y gestiona suscripciones.
3. **Responsable (Sede/Local)**: Supervisa tareas y equipos de una sede específica.
4. **Miembro (Operativo)**: Realiza tareas asignadas.
5. **Viewer (Consultivo)**: Acceso de solo lectura a tableros y reportes.
