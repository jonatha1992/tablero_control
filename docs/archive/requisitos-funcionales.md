# Requisitos Funcionales — Tablero de Control

**Sistema:** SaaS multi-tenant de gestión de tareas y proyectos  
**Empresa propietaria:** TecnoFusión  
**Versión:** 1.0  
**Fecha:** Mayo 2026

---

## 1. Descripción General

Tablero de Control es una plataforma SaaS multi-tenant que permite a empresas (negocios) gestionar equipos, locales/sectores, tareas, proyectos, ciclos y objetivos. Cada negocio opera de forma aislada; la empresa TecnoFusión administra la plataforma completa como superadmin.

---

## 2. Actores del Sistema

| Actor | Descripción |
|---|---|
| **Superadmin** | Empleado de TecnoFusión. Acceso total a la plataforma: ve todos los negocios, usuarios, suscripciones y métricas globales. |
| **Admin** | Administrador de un negocio. Gestiona usuarios, locales, equipos, proyectos, suscripción y configuración de su empresa. |
| **Responsable** | Responsable de un local o sector. Puede gestionar tareas de toda la empresa y ver reportes. |
| **Miembro** | Integrante del equipo. Puede crear tareas y editar solo las que tiene asignadas. |
| **Viewer** | Solo lectura. Ve tareas y reportes sin poder modificar nada. |
| **Pending** | Usuario invitado que aún no aceptó. Sin permisos operativos. |

---

## 3. Módulos del Sistema

---

### 3.1 Autenticación y Registro

#### RF-01 — Registro de nuevo negocio
- El sistema permite registrar un nuevo usuario junto con un nuevo negocio en un solo flujo.
- Al registrarse, se crea automáticamente un negocio (Business) en plan **free** y el usuario queda como **admin** de ese negocio.
- El usuario debe proveer: nombre completo, email, contraseña y nombre del negocio.
- Si el email coincide con la variable de entorno `SUPERADMIN_EMAILS`, el usuario se crea con rol **superadmin** y no se le asocia ningún negocio.

#### RF-02 — Inicio de sesión
- El sistema permite iniciar sesión con email y contraseña.
- Tras autenticarse con Firebase, el sistema consulta el perfil en PostgreSQL. Si no existe, lo crea automáticamente (auto-provisión).
- Usuarios con rol `superadmin` son redirigidos a `/superadmin`. El resto a `/dashboard`.

#### RF-03 — Recuperación de contraseña
- El sistema envía un email de reset de contraseña al email indicado.
- Si el email no existe en el sistema, la respuesta es igualmente exitosa (evita enumeración de usuarios).

#### RF-04 — Perfil de usuario
- El usuario autenticado puede consultar y actualizar su perfil: nombre, avatar, zona horaria, idioma, preferencias de notificaciones y layout del dashboard.
- El avatar se sube a Cloudinary (200×200 px optimizado).

---

### 3.2 Gestión del Negocio

#### RF-05 — Configuración del negocio
- El admin puede actualizar el nombre del negocio y sus configuraciones generales (maxLocations, maxUsers, features, localeTypes, timezone).
- Solo usuarios con rol **admin** o **superadmin** pueden modificar la configuración.

#### RF-06 — Límites por plan
El sistema aplica los siguientes límites según el plan del negocio:

| Plan | Usuarios | Locales | Proyectos | Almacenamiento |
|---|---|---|---|---|
| free | 5 | 1 | 1 | 5 MB |
| basic | 20 | 10 | 5 | 50 MB |
| pro | ilimitado | ilimitado | ilimitado | 500 MB |
| enterprise | ilimitado | ilimitado | ilimitado | ilimitado |

- El sistema valida los límites antes de crear usuarios, locales o proyectos. Si se supera el límite, retorna HTTP 429 con `{ error: 'members_limit_exceeded', limit, current }`.

#### RF-07 — Estado del negocio
Un negocio puede estar en los estados: `active`, `trial`, `suspended`, `cancelled`.  
Un negocio suspendido no puede operar. El sistema suspende automáticamente un negocio cuando su suscripción entra en `past_due`.

---

### 3.3 Gestión de Tareas (Kanban)

#### RF-08 — Crear tarea
- Cualquier usuario autenticado (excepto viewer y pending) puede crear tareas.
- Campos disponibles: título, descripción, estado, prioridad, tipo, sector asignado, proyecto, fecha de inicio, fecha de vencimiento (con hora), horas estimadas, asignados, tags, tarea padre (subtarea), configuración de recurrencia.
- Al asignar un usuario a una tarea, el sistema envía una notificación push y un email (según preferencias del destinatario).

#### RF-09 — Estados de tarea
Las tareas recorren los siguientes estados en el tablero Kanban:

`backlog` → `todo` → `in_progress` → `in_review` → `done` → `blocked`

El movimiento entre estados puede realizarse por drag & drop en el tablero o desde el detalle de la tarea.

#### RF-10 — Prioridades de tarea
Cuatro niveles de prioridad: `low`, `medium`, `high`, `urgent`. Visibles con indicadores de color en el kanban.

#### RF-11 — Tipos de tarea
`feature`, `bug`, `improvement`, `task`, `documentation`.

#### RF-12 — Tareas recurrentes
- Una tarea puede configurarse como recurrente con frecuencia: diaria, semanal, bisemanal o mensual.
- Cuando una tarea recurrente se mueve al estado `done`, el sistema crea automáticamente la siguiente ocurrencia con la fecha calculada según la configuración.
- La nueva ocurrencia se crea en estado `todo`.

#### RF-13 — Subtareas
- Una tarea puede tener tareas hijas (subtareas) vinculadas por `parentId`.
- Las subtareas se gestionan desde el detalle de la tarea padre.

#### RF-14 — Checklist
- Cada tarea puede tener un checklist de ítems con estado (completado / pendiente).
- El progreso del checklist se muestra en la tarjeta del kanban.

#### RF-15 — Comentarios
- Los usuarios pueden agregar comentarios en las tareas.
- Al comentar, el sistema notifica a todos los asignados excepto al autor del comentario.
- Los comentarios pueden incluir archivos adjuntos.

#### RF-16 — Archivos adjuntos
- Se pueden subir archivos adjuntos a las tareas (imágenes convertidas a WebP, otros archivos aceptados según tipo MIME).
- Los archivos se almacenan en Cloudinary y se registra un audit log por cada adjunto.
- El límite de almacenamiento se valida según el plan.

#### RF-17 — Registro de horas (Time Tracking)
- Los usuarios pueden registrar horas trabajadas en una tarea (fecha, horas, nota).
- Solo el creador del registro, el admin o el superadmin pueden eliminar un registro de horas.

#### RF-18 — Filtros del tablero Kanban
El tablero permite filtrar tareas por: texto (búsqueda), prioridad y sector/local.

#### RF-19 — Selección múltiple de tareas
El sistema permite seleccionar múltiples tareas simultáneamente para:
- Mover en lote a otro estado.
- Eliminar en lote.

#### RF-20 — Crear tarea por voz (IA)
- El usuario puede dictar una tarea por voz.
- El audio se transcribe con Groq Whisper Large V3 Turbo.
- El texto transcripto se procesa con LLM para extraer: título, prioridad, estado, asignados (por mención de nombre), tags, fecha de vencimiento, hora y horas estimadas.
- Se crean las tareas automáticamente con los datos extraídos.

#### RF-21 — Crear tarea desde texto (IA)
- El usuario puede escribir una descripción en lenguaje natural.
- El sistema extrae tareas estructuradas usando LLM, con soporte para menciones a miembros del equipo.

#### RF-22 — Vista Kanban
- El tablero muestra columnas por estado. Las tarjetas son arrastrables entre columnas.
- La hora de vencimiento se muestra en la tarjeta solo si es distinta de medianoche.
- Las columnas activas son configurables por el usuario.

---

### 3.4 Períodos / Ciclos

#### RF-23 — Gestión de ciclos
- Un ciclo representa un período de trabajo (equivalente a un sprint).
- Campos: nombre, objetivo (goal), estado, fecha de inicio, fecha de fin.
- Estados del ciclo: `planning` → `active` → `completed` → `closed`.

#### RF-24 — Transiciones de ciclo
- **Iniciar** (`planning` → `active`): activa el ciclo.
- **Completar** (`active` → `completed`): cierra el ciclo.
- **Cerrar** (`completed` → `closed`): archiva el ciclo.

#### RF-25 — Tareas en ciclos
- Las tareas pueden asignarse a un ciclo o removerse de él de forma individual o en lote.

---

### 3.5 Objetivos

#### RF-26 — Gestión de objetivos
- Un objetivo representa una meta de negocio con fecha límite y estado.
- Campos: nombre, descripción, color, estado, fecha objetivo, proyecto vinculado.
- Estados: `active`, `completed`, `archived`.

#### RF-27 — Tareas vinculadas a objetivos
- Las tareas pueden vincularse a un objetivo para medir el progreso hacia la meta.

#### RF-28 — Acciones sobre objetivos
- **Completar**: marca el objetivo como `completed`.
- **Archivar**: mueve el objetivo a `archived`.

---

### 3.6 Proyectos

#### RF-29 — Gestión de proyectos
- Los proyectos agrupan tareas relacionadas. Solo **admin** y **superadmin** pueden crear y eliminar proyectos.
- Campos: nombre, descripción, estado, equipo asociado, fecha de inicio, fecha de fin.
- Estados: `planning`, `active`, `on_hold`, `completed`, `cancelled`.
- El sistema valida el límite de proyectos según el plan antes de crear uno nuevo.

---

### 3.7 Locales / Sectores

#### RF-30 — Gestión de locales
- El admin puede crear locales o sectores (sucursales, áreas, depósitos, etc.).
- Campos: nombre, tipo, dirección, horario operativo, metadatos, estado.
- Estados: `active`, `inactive`, `maintenance`, `closed`, `incident`.
- El sistema valida el límite de locales según el plan antes de crear uno nuevo.

---

### 3.8 Equipo y Miembros

#### RF-31 — Crear usuario (invitación directa)
- El admin puede crear un usuario directamente: se crea la cuenta en Firebase, se registra en la BD y se envía un email con link de acceso/reset de contraseña.
- El sistema valida el límite de usuarios del plan antes de crear. Si se supera, retorna 429.

#### RF-32 — Invitación por link
- El admin puede generar links de invitación configurables: rol asignado, cantidad máxima de usos, fecha de expiración y local al que se vincula.
- El link tiene un token único. Al acceder, el usuario puede registrarse y vincularse automáticamente al negocio.
- Al aceptar una invitación, el sistema valida que el negocio no haya superado el límite de usuarios.

#### RF-33 — Actualización de miembro
- Se puede modificar: nombre, rol, local asignado, rol personalizado, estado activo/inactivo.
- Solo usuarios con permiso `business.users.crud` o `business.users.changeRole` pueden modificar.

#### RF-34 — Desactivar / Reactivar miembro
- Desactivar a un usuario lo marca como `isActive = false` y deshabilita su acceso.
- Si el usuario desactivado era admin, el sistema reasigna la gestión.
- Un usuario desactivado puede ser reactivado por el admin.

#### RF-35 — Roles personalizados
- El admin puede crear roles personalizados (`CustomRole`) con un conjunto de permisos granular (`PermissionSet`).
- Los permisos granulares cubren: tareas, locales, equipos, usuarios, reportes, facturación y adjuntos.
- Un usuario puede tener asignado un rol personalizado que extiende (o restringe) los permisos de su rol base.

---

### 3.9 Calendario

#### RF-36 — Vista calendario
- El sistema muestra las tareas con fecha de vencimiento en una vista de calendario (mes, semana, día).
- Permite filtrar por sector/local y navegar entre fechas.

---

### 3.10 Cronograma (Gantt)

#### RF-37 — Vista Gantt
- El sistema muestra todas las tareas con fechas de inicio y vencimiento en una línea de tiempo estilo Gantt.
- Permite identificar dependencias y solapamientos de plazos visualmente.

---

### 3.11 Notificaciones

#### RF-38 — Notificaciones en tiempo real
- El sistema genera notificaciones para los siguientes eventos:
  - Asignación a una tarea.
  - Actualización de una tarea asignada.
  - Mención en un comentario.
  - Información general del sistema.

#### RF-39 — Canales de notificación
- **In-app**: Notificaciones guardadas en base de datos, accesibles desde el panel.
- **Push (FCM)**: Notificaciones push al dispositivo si el usuario registró un token FCM.
- **Email**: Email enviado según preferencias del usuario (Resend como proveedor principal, Gmail SMTP como fallback).

#### RF-40 — Gestión de notificaciones
- El usuario puede marcar notificaciones individuales como leídas o marcar todas como leídas.
- La bandeja muestra las últimas 30 notificaciones con contador de no leídas.

---

### 3.12 Reportes

#### RF-41 — Dashboard de métricas (business)
- El dashboard principal muestra métricas clave: total de tareas, tareas activas, completadas, bloqueadas y urgentes, distribuidas por sector.

#### RF-42 — Reportes detallados
- El módulo de reportes permite visualizar y exportar análisis de:
  - Rendimiento del equipo.
  - Evolución de tareas por estado.
  - Tareas por prioridad y tipo.
  - Tiempo estimado vs. tiempo real.
- Disponible filtrado por rango de fechas.
- La exportación de reportes está disponible a partir del plan **pro**.

---

### 3.13 Facturación y Suscripción

#### RF-43 — Selección de plan
- El admin puede ver los planes disponibles con sus precios y límites (obtenidos dinámicamente desde la base de datos).
- Puede iniciar el proceso de contratación de un plan.

#### RF-44 — Pago con Mercado Pago
- El sistema integra Mercado Pago para pagos únicos (checkout) y suscripciones recurrentes (preapproval).
- Al completar el pago, MP notifica al sistema vía webhook.
- El webhook valida la firma HMAC-SHA256 antes de procesar.

#### RF-45 — Activación de suscripción
- Al recibir un webhook de preapproval autorizado, el sistema activa la suscripción, registra el período actual y actualiza el plan del negocio.

#### RF-46 — Cobro recurrente
- Cada pago aprobado por MP extiende el período de suscripción y genera una factura (Invoice) con estado `paid`.

#### RF-47 — Vencimiento y suspensión
- Un cron job diario verifica suscripciones vencidas.
- 7 días antes del vencimiento: envía email de advertencia.
- Al vencer: marca la suscripción como `past_due` y suspende el negocio (`status = suspended`).

#### RF-48 — Cancelar suscripción
- El admin puede cancelar su suscripción. La suscripción permanece activa hasta el fin del período vigente (`cancelAtPeriodEnd = true`).

#### RF-49 — Recuperar suscripción
- Un admin puede reactivar una suscripción cancelada antes de que expire el período actual.

#### RF-50 — Historial de facturas
- El sistema registra todas las facturas generadas. El admin puede ver el historial de las últimas 20 facturas con estado y monto.

---

### 3.14 Auditoría

#### RF-51 — Registro de auditoría
- Toda operación de creación, modificación o eliminación sobre entidades del sistema queda registrada en el log de auditoría.
- El registro incluye: actor (usuario), rol del actor, negocio, acción, tipo de entidad, ID de entidad, metadatos adicionales, IP de origen y timestamp.
- Cubre 37 acciones auditadas en los dominios: business, user, role, subscription, invoice, task, attachment, plan_config.

---

### 3.15 Panel Superadmin

#### RF-52 — Métricas globales
- El superadmin ve métricas de toda la plataforma: total de negocios activos, usuarios registrados, tareas creadas y MRR (Monthly Recurring Revenue).

#### RF-53 — Gestión de negocios
- El superadmin puede listar, ver detalle, suspender y reactivar cualquier negocio.
- Puede ver los usuarios y la suscripción de cada negocio.

#### RF-54 — Gestión de usuarios (plataforma)
- El superadmin puede listar todos los usuarios, ordenar por nombre/email/rol/estado/fecha, ver detalle, modificar y eliminar.
- Soporta operaciones en lote (bulk).

#### RF-55 — Gestión de suscripciones
- El superadmin puede listar y ver el estado de todas las suscripciones, incluyendo datos de Mercado Pago.

#### RF-56 — Configuración de planes
- El superadmin puede crear y modificar los planes del sistema: precio mensual, precio anual, límites de usuarios, locales, proyectos y adjuntos.
- Los cambios en planes se reflejan en tiempo real para todos los negocios (la lectura es dinámica desde la BD).

#### RF-57 — Audit log global
- El superadmin puede consultar el log de auditoría completo con filtros por actor, acción, fecha y negocio.

---

### 3.16 Tour de Onboarding

#### RF-58 — Tour interactivo
- Al ingresar por primera vez al dashboard, el sistema muestra un tour guiado de 11 pasos que presenta cada sección del sistema.
- El tour se muestra una única vez por usuario (estado guardado en localStorage).
- El usuario puede cerrar el tour en cualquier momento con el botón X o completarlo con el botón "¡Entendido!".
- En ambos casos, el tour queda marcado como completado y no vuelve a aparecer.

---

## 4. Reglas de Negocio Transversales

### RN-01 — Aislamiento multi-tenant
Todos los datos están aislados por `businessId`. Un usuario nunca puede acceder a datos de otro negocio. El sistema valida `assertSameTenant()` en cada operación sobre recursos.

### RN-02 — Auditoría obligatoria
Toda mutación (CREATE, UPDATE, DELETE) en rutas de API debe registrar un `writeAuditLog()` después de ejecutarse.

### RN-03 — Notificaciones en background
Las notificaciones (in-app, push, email) se envían sin bloquear la respuesta de la API. Los fallos de notificación no afectan el flujo principal.

### RN-04 — Tokens FCM inválidos
El sistema limpia automáticamente los tokens FCM inválidos del perfil del usuario al detectar errores de envío push.

### RN-05 — Normalización de email
Todos los emails se almacenan y comparan en minúsculas y sin espacios (`lowercase + trim`).

### RN-06 — Invitados por email
Si un usuario fue invitado por email y se registra con ese email pero distinto UID de Firebase (caso cuenta nueva), el sistema actualiza el UID para vincular correctamente al usuario.

### RN-07 — Webhook seguro
El webhook de Mercado Pago valida la firma HMAC-SHA256 de cada request antes de procesar. Requests sin firma válida son rechazados con HTTP 400.

### RN-08 — Recurrencia automática
El sistema no permite crear manualmente la siguiente ocurrencia de una tarea recurrente. La creación es exclusivamente automática al completar la tarea actual (`TaskService.moveTask`).

### RN-09 — Superadmin sin tenant
El superadmin no tiene `businessId` asociado. Puede operar sobre cualquier negocio pero sus acciones quedan auditadas con el businessId del negocio afectado.

---

## 5. Integraciones Externas

| Servicio | Uso |
|---|---|
| **Firebase Auth** | Autenticación de usuarios, reset de contraseña |
| **Firebase FCM** | Push notifications a dispositivos móviles |
| **PostgreSQL + Prisma** | Base de datos principal |
| **Groq (Whisper + LLM)** | Transcripción de audio y extracción de tareas con IA |
| **Cloudinary** | Almacenamiento de avatars y adjuntos de tareas |
| **Mercado Pago** | Pagos únicos y suscripciones recurrentes |
| **Resend** | Envío de emails transaccionales (primario) |
| **Gmail SMTP** | Envío de emails (fallback) |

---

## 6. Templates de Email

El sistema envía los siguientes emails transaccionales:

| Template | Disparador |
|---|---|
| WelcomeEmail | Registro exitoso |
| ResetPasswordEmail | Solicitud de recuperación de contraseña |
| TeamInviteEmail | Invitación a unirse al equipo |
| TaskAssignedEmail | Asignación a una tarea |
| SubscriptionActivatedEmail | Activación de suscripción |
| SubscriptionExpiryEmail | Advertencia de vencimiento (7 días antes) |
| PaymentSuccessEmail | Pago aprobado |
| PaymentFailedEmail | Pago rechazado |
