# Guía de Usuario - Tablero de Control

## Acceso al Sistema

### Inicio de Sesión
1. Navega a `http://localhost:3000`
2. Ingresa tu email y contraseña, o usa "Continuar con Google"
3. Los superadmins son redirigidos automáticamente a `/superadmin`; el resto a `/dashboard`

### Registro
- Abre solo para emails en la lista `SUPERADMIN_EMAILS` (auto-provisioning) o por invitación de un admin
- El admin invita miembros desde `/dashboard/equipo` — llega un email con enlace de activación

## Dashboard Principal

Centro de control con KPIs en tiempo real:
- **Tareas Activas** — tareas en progreso en el negocio
- **Completadas Hoy** — finalizadas en el día
- **Bloqueadas** — requieren atención
- **Velocity** — ritmo de completitud semanal

## Módulo de Tareas

Acceso desde `/dashboard/tareas`. Cuatro vistas disponibles:

### Kanban (`/dashboard/tareas`)
Vista principal de tablero. Columnas:
- **Backlog** → **Por hacer** → **En progreso** → **En revisión** → **Completada** → **Bloqueada**

Funcionalidades:
- **Drag & drop** entre columnas — arrastra tarjetas para cambiar estado
- **Selección múltiple** — selecciona varias tareas y mueve/elimina en lote
- **Filtros** — búsqueda por texto, prioridad, ubicación
- **Dictado AI** — crea tareas por voz con transcripción Whisper + extracción LLM (detecta asignados, fechas, prioridad, tags, recurrencia)
- **Subtareas** — tareas anidadas visibles en el modal de detalle
- **Archivos adjuntos** — sube imágenes/documentos (Cloudinary)
- **Comentarios** — hilo de discusión por tarea
- **Registro de tiempo** — carga horas trabajadas por tarea
- **Recurrencia** — tareas que se repiten (diaria/semanal/mensual/personalizada). Al completar una tarea recurrente se crea automáticamente la siguiente ocurrencia

### Agenda (`/dashboard/tareas/agenda`)
Vista inteligente estilo Toki. Clasifica tareas automáticamente en secciones:
- **Foco** — las más urgentes del día según scoring
- **Vencidas** — pasaron su fecha límite sin completar
- **Hoy con hora** — tienen fecha+hora hoy
- **Para hoy** — fecha de hoy sin hora específica
- **Esta semana** — dentro de los próximos 7 días
- **Próximamente** — más de 7 días
- **Sin fecha** — tareas sin fecha asignada
- **Completadas** — finalizadas (colapsadas por defecto)

Cada sección es colapsable. El score se calcula por prioridad + estado + si estás asignado/eres creador + horas vencidas.

### Calendario (`/dashboard/tareas/calendario`)
Vista mensual con FullCalendar. Muestra tareas con `dueDate` como eventos. Soporta:
- Vista mes / semana / lista
- Clic en tarea abre modal de detalle
- Tareas con hora muestran el horario exacto

### Cronograma (`/dashboard/tareas/cronograma`)
Vista Gantt para visualizar tareas en el tiempo.

## Equipo (`/dashboard/equipo`)

Gestión de miembros del negocio:
- **Lista de miembros** con rol, ubicación asignada y estado
- **Invitar miembro** — envía email de invitación con rol preseleccionado
- **Editar miembro** — cambiar rol, ubicación, activar/desactivar
- **Eliminar miembro** — con confirmación

### Roles personalizados (`/dashboard/equipo/roles`)
Los admins pueden crear roles custom con permisos granulares por módulo (tareas, ubicaciones, equipos, usuarios, reportes, facturación, adjuntos). Los roles custom heredan de un rol base (`responsable`, `miembro` o `viewer`).

## Sectores (`/dashboard/sectores`)

Gestión de ubicaciones/locales del negocio:
- Crear, editar y eliminar sectores
- Asignar responsable
- Ver miembros asignados a cada sector

## Ciclos y Objetivos

### Ciclos (`/dashboard/ciclos`)
Períodos de trabajo (sprints). Cada ciclo puede contener tareas. Al mover una tarea a un ciclo se valida que pertenezca al mismo negocio.

### Objetivos (`/dashboard/objetivos`)
Iniciativas de alto nivel. Pueden agrupar tareas y tener progreso calculado.

## Billing (`/dashboard/billing`)

- Ver plan actual y límites (usuarios, ubicaciones, proyectos)
- Upgrade de plan — checkout MercadoPago
- Historial de facturas
- Cancelar suscripción

## Configuración (`/dashboard/config`)

- Datos del negocio (nombre, logo)
- Preferencias de notificaciones (email / push)
- Layout del dashboard

## Panel Superadmin (`/superadmin`)

Solo para emails en `SUPERADMIN_EMAILS` (TecnoFusión):

| Sección | Descripción |
|---------|-------------|
| `/superadmin/planes` | Editar precios y límites de cada plan (free/basic/pro/enterprise) |
| `/superadmin/businesses` | Ver y gestionar todos los negocios registrados |
| `/superadmin/users` | Ver y gestionar todos los usuarios del sistema |
| `/superadmin/subscriptions` | Estado de suscripciones activas |
| `/superadmin/audit` | Log de auditoría de todas las acciones |

## Roles y Permisos

| Rol | Capacidades |
|-----|-------------|
| `superadmin` | Acceso total al sistema (TecnoFusión) |
| `admin` | Gestión completa de su negocio — usuarios, tareas, config, billing |
| `responsable` | Gestiona su local/sector — crea/edita tareas de su área |
| `miembro` | Crea y gestiona sus propias tareas, ve las del equipo |
| `viewer` | Solo lectura |

Los custom roles permiten permisos granulares por módulo dentro de estas categorías.

## Notificaciones Push

Si el navegador lo permite, el sistema envía notificaciones push (Firebase FCM) para:
- Tarea asignada
- Comentario en tarea donde participas
- Mención en comentario

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+K` | Abrir búsqueda global |
| `Ctrl+N` | Nueva tarea |
| `Esc` | Cerrar modal |

## Soporte

1. Revisa los logs en Firebase Emulator UI (`http://localhost:4000`)
2. Consulta la documentación técnica en `/docs`
3. Contacta al administrador del sistema
