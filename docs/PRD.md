# PRD — Tablero de Control

> **Product Requirements Document (as-built).** Documenta qué es Tablero de Control hoy, para quién, qué problema resuelve y qué requisitos cumple. Fuente de verdad de producto; los detalles técnicos viven en los docs por dominio enlazados al final.

| Campo | Valor |
|---|---|
| Producto | Tablero de Control |
| Empresa dueña | TecnoFusión |
| Tipo | SaaS multi-tenant (B2B) |
| Estado | En producción (rama `test` → Railway) |
| Última actualización | 2026-06-23 |
| Doc relacionado | [SCOPE_AND_REQUIREMENTS.md](functional/SCOPE_AND_REQUIREMENTS.md) · [GLOSSARY_AND_MODELS.md](functional/GLOSSARY_AND_MODELS.md) |

---

## 1. Resumen ejecutivo

Tablero de Control es un SaaS de gestión de tareas y proyectos para organizaciones con **múltiples sedes, sectores o áreas**. Combina la simplicidad visual de Trello (kanban, drag & drop) con la estructura de Jira (jerarquía, tipos de tarea, prioridades, trazabilidad), y agrega capacidades propias: agenda inteligente con scoring, asistente IA por voz/texto, y facturación integrada con precios dinámicos por plan.

Cada negocio es un **tenant aislado**. El control de acceso es granular: 5 roles base más roles custom por negocio. La empresa dueña (TecnoFusión) opera un panel superadmin con visión y control global.

---

## 2. Problema

Las organizaciones multi-sede operan hoy con herramientas fragmentadas:

- **Trello** es simple pero no modela jerarquía organizacional (locales, sectores, responsables) ni control de acceso por rol.
- **Jira** modela estructura pero es pesado, caro y orientado a software, no a operación de locales.
- **Planillas / WhatsApp** no dan trazabilidad, ni notificaciones, ni reporting.

Resultado: pérdida de visibilidad sobre quién hace qué, en qué sede, con qué prioridad; sin auditoría ni métricas; sin forma de cobrar/escalar el servicio de forma controlada.

---

## 3. Objetivos del producto

| Objetivo | Cómo se mide |
|---|---|
| Centralizar la operación multi-sede en una sola herramienta | % de tareas gestionadas en plataforma vs canales externos |
| Dar control de acceso granular y seguro | Cero incidentes cross-tenant; RBAC aplicado en cada operación |
| Reducir fricción de captura de tareas | Tareas creadas vía IA (voz/texto) / total |
| Monetizar de forma recurrente y escalable | MRR, negocios activos, conversión Free → pago |
| Dar visibilidad operativa accionable | Uso de agenda inteligente, reportes y dashboard |

### No-objetivos (fuera de alcance actual)

- Motor de automatizaciones ("cuando X, hacer Y").
- Estados de workflow configurables por negocio.
- Apps móviles nativas (se prioriza Web responsive / PWA).
- Integraciones con terceros (Slack, SAP, etc.).
- Videollamadas integradas.

---

## 4. Usuarios y roles

```
superadmin  (5) → TecnoFusión — acceso total al sistema
admin       (4) → Dueño del negocio — configura todo, gestiona suscripción
responsable (3) → Responsable de local/sector — supervisa su sede
miembro     (2) → Operativo — ejecuta tareas asignadas, registra horas
viewer      (1) → Solo lectura — tableros y reportes
```

Además: **roles custom** por negocio con `PermissionSet` granular (tasks / locations / teams / users / reports / billing / attachments). Ver [permissions.md](permissions.md).

| Usuario | Necesidad principal |
|---|---|
| Superadmin | Operar el negocio SaaS: activar/suspender clientes, ver MRR, editar planes |
| Admin | Estructurar su organización (locales, equipos, tableros) y planificar |
| Responsable | Supervisar y distribuir el trabajo de su sede |
| Miembro | Saber qué hacer hoy, ejecutar, registrar horas |
| Viewer | Consultar estado sin riesgo de modificar |

---

## 5. Requisitos funcionales

Referencia canónica: [SCOPE_AND_REQUIREMENTS.md](functional/SCOPE_AND_REQUIREMENTS.md) (RF-001 … RF-019). Resumen por dominio:

### 5.1 Organización y multi-tenancy
- Aislamiento total de datos entre negocios (`assertSameTenant` en cada operación).
- Gestión de locales/sedes y sectores/equipos con responsable asignado.
- RBAC de 5 roles + roles custom.

### 5.2 Tareas (core)
- Kanban de 6 columnas con drag & drop: Backlog → Por hacer → En progreso → En revisión → Completada → Bloqueada.
- Creación con título, descripción, prioridad, tipo, fecha/hora límite, asignación múltiple, tablero, ciclo y objetivo.
- Checklists con progreso, comentarios con menciones `@usuario`, adjuntos (Cloudinary), registro de tiempo. (Subtareas jerárquicas vía `parentId` quedaron pausadas como concepto de producto — la UI no las muestra ni crea; se transforman en ítems de checklist.)
- **Recurrencia** (diaria/semanal/mensual/personalizada): al completar una tarea recurrente el sistema genera la siguiente ocurrencia.
- Selección múltiple con acciones bulk; filtros por texto, prioridad, local, proyecto, ciclo y objetivo.

### 5.3 Planificación
- Ciclos/períodos (planning → active → completed → closed); un solo ciclo activo a la vez.
- Objetivos/OKRs con progreso 0–100% calculado por tareas vinculadas.

### 5.4 Vistas
- **Agenda inteligente** con scoring automático (prioridad + estado + asignación + horas vencidas), refresco cada 60s.
- **Calendario** (FullCalendar) mes/semana/lista con drag & drop y proyección de recurrencias.
- **Cronograma/Gantt** por tarea.
- **Dashboard** con KPIs de carga y distribución.

### 5.5 Asistente IA
- Dictado por voz → Groq Whisper Large V3 Turbo transcribe.
- Texto libre → LLM extrae campos (título, prioridad, estado, asignados, fecha, tags, recurrencia, horas).
- Chat para consulta y creación de tareas.

### 5.6 Equipo
- Invitación por email o link (con vencimiento y límite de usos); creación directa de usuarios por admin.

### 5.7 Facturación
- 4 planes: Free · Basic · Pro · Enterprise.
- Precios y límites **dinámicos**, editables por superadmin sin deploy.
- Pagos vía MercadoPago **Checkout Pro** (no Preapproval: la API de preapproval exige `payer_email` fijo, lo que rompe el flujo cuando quien paga no es quien inicia el checkout). Renovación manual al vencer el período; historial de facturas.
- Límites por plan: usuarios, locales, proyectos, adjuntos.

### 5.8 Superadmin (TecnoFusión)
- KPIs globales (negocios activos, MRR, usuarios), activar/suspender negocios, editar precios/límites, auditoría global.

### 5.9 Transversales
- Notificaciones push (FCM), in-app (campana) y email (Resend).
- Auditoría: log obligatorio en cada CREATE/UPDATE/DELETE.
- Onboarding: tour guiado (driver.js) en primer login + centro de ayuda.

---

## 6. Requisitos no funcionales

| ID | Requisito |
|---|---|
| RNF-001 | Mover tareas en el kanban se procesa en < 500 ms |
| RNF-002 | UI no bloqueante durante sincronización (React Query) |
| RNF-003 | Ningún usuario actúa por encima de su jerarquía (RBAC en cada API) |
| RNF-004 | Datos protegidos por reglas Firestore + políticas de acceso a nivel API hacia PostgreSQL |
| RNF-005 | Patrón Repository para mantener el backend intercambiable |

---

## 7. Arquitectura (alto nivel)

```
components / pages
   ↓  React Query (server state) + Zustand (UI state)
API Routes (src/app/api/**)        ← HTTP boundary
   ↓ requireUser → assertSameTenant → can(user, action)
services/                          ← lógica de negocio
   ↓
repositories/ (singletons)         ← acceso a datos
   ↓
src/lib/prisma.ts → PostgreSQL
```

- **Auth**: Firebase Auth solo autentica (JWT); todos los datos de dominio viven en PostgreSQL.
- **Stack**: Next.js 16 (App Router) · React 19 · TS strict · Prisma 7 · Tailwind 4 + Radix · MercadoPago · Cloudinary · Groq · Resend.
- Decisiones de arquitectura registradas en [decisions/](decisions/).

---

## 8. Métricas de éxito

- **Negocio**: MRR, negocios activos, conversión Free → pago, churn.
- **Activación**: % de negocios que crean ≥ 1 tablero y ≥ 5 tareas en la primera semana.
- **Engagement**: tareas creadas/semana, uso de agenda inteligente, % de tareas vía IA.
- **Calidad**: cero incidentes cross-tenant, latencia kanban < 500 ms, cobertura de tests.

---

## 9. Riesgos y dependencias

| Riesgo | Mitigación |
|---|---|
| Dependencia de proveedores externos (Firebase, MP, Groq, Cloudinary) | Patrón Repository + degradación elegante de FCM ([ADR-005](decisions/005-firebase-fcm-graceful-degradation.md)) |
| Fuga cross-tenant en arrays de IDs | Validación de `businessId` antes de operar ([ADR-003](decisions/003-cross-tenant-task-injection.md), [ADR-007](decisions/007-task-business-id-isolation.md)) |
| Límites por plan sin enforcement completo | Pendiente: `limitProjects` / `limitAttachments` aún sin gate (gap conocido) |
| Costos de IA (Groq) escalando con uso | Monitorear consumo; asociar a plan en el futuro |
| **Tarea madre de recurrencia mutable**: mientras una tarea con `recurrence` no generó su primera ocurrencia (`recurrenceSpawnedAt = null`), puede editarse o borrarse sin guard en `PATCH`/`DELETE` (`/api/tasks/[id]`), perdiendo la regla de repetición para toda la cadena futura — no existe plantilla inmutable separada | Confirmado, sin fix implementado; pendiente decisión de producto (guard en API y/o aviso en UI) |

---

## 10. Roadmap (próximo)

Capturado del feedback de cliente (2026-05-29) y backlog:

- Dashboard de tareas futuras.
- Backlog dedicado y mejoras de filtros.
- Resolver mutabilidad de la "tarea madre" en cadenas de recurrencia (ver Riesgos, §9).
- Enforcement de límites `limitProjects` / `limitAttachments` (modelo pago por uso).

---

## Referencias

| Dominio | Doc |
|---|---|
| Tareas, Kanban, Agenda, Sprints | [tasks.md](tasks.md) |
| Auth, RBAC, permisos | [permissions.md](permissions.md) |
| Billing, MercadoPago, planes | [billing.md](billing.md) |
| API routes | [api-routes.md](api-routes.md) |
| Integraciones | [integrations.md](integrations.md) |
| Modelos Prisma | [models.md](models.md) |
| Frontend / stores | [frontend.md](frontend.md) |
| Tests | [testing.md](testing.md) |
| Deploy | [deploy.md](deploy.md) |
| Superadmin | [superadmin.md](superadmin.md) |
| Decisiones de arquitectura | [decisions/](decisions/) |
