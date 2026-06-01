# Guía de usuario — Tablero de Control

## Acceso al sistema

### Inicio de sesión
1. Navegar a la URL de la aplicación
2. Ingresar email y contraseña, o usar "Continuar con Google"
3. Los superadmins son redirigidos a `/superadmin`; el resto a `/dashboard`

### Registro
- Solo para emails en la lista `SUPERADMIN_EMAILS` (auto-provisioning)
- O mediante link de invitación generado por un admin

---

## Dashboard (`/dashboard`)

Vista principal con KPIs en tiempo real:
- **Tareas activas** — en progreso en el negocio
- **Completadas hoy** — finalizadas en el día
- **Bloqueadas** — requieren atención
- **Urgentes** — prioridad urgente sin completar

---

## Módulo de Tareas

### Kanban (`/dashboard/tareas`)

Tablero principal con drag & drop. Columnas de izquierda a derecha:

**Backlog → Por hacer → En progreso → En revisión → Completada → Bloqueada**

**Barra de sprint (sprint tabs)** — debajo del toolbar, filtra tareas por ciclo:
- **Todas** — sin filtro de ciclo
- **Backlog** — solo tareas sin ciclo asignado
- **[Nombre del ciclo activo]** — punto verde, solo si hay un ciclo activo
- **Otros ▾** — dropdown con ciclos en planificación, completados o cerrados

**Funcionalidades del kanban:**
- Drag & drop entre columnas para cambiar estado
- Selección múltiple (checkbox) + acciones bulk: mover a columna, eliminar
- Buscador por texto, filtros por prioridad y sector
- Crear tarea con formulario o con el **Asistente IA** (botón ✨)
- Ver columnas activas: configurar qué columnas se muestran

**Campos de una tarea:**
- Título, descripción, tipo (Feature / Bug / Mejora / Tarea / Documentación)
- Prioridad: Baja / Media / Alta / Urgente
- Estado: Backlog → Hecho / Bloqueado
- Asignados (múltiples), sector, proyecto, ciclo, objetivo
- Fecha límite con hora opcional
- Subtareas, checklist (lista de pasos con progreso), adjuntos, comentarios, registro de tiempo
- Recurrencia: diaria / semanal / quincenal / mensual / personalizada

**Recurrencia:** al completar una tarea recurrente por primera vez, el sistema crea automáticamente la siguiente ocurrencia con el checklist reseteado (ítems sin marcar). No hace falta crearlo a mano. Si reabrís una tarea ya finalizada y la volvés a marcar Finalizado, no se duplica la próxima ocurrencia.

---

### Agenda inteligente (`/dashboard/tareas/agenda`)

Vista diaria tipo Toki. Clasifica tus tareas automáticamente en secciones ordenadas por urgencia:

| Sección | Criterio |
|---|---|
| ⚡ Foco del día | Top 3 tareas por score de urgencia |
| 🔴 Vencidas | `dueDate` pasada, sin completar |
| 🕐 Hoy con hora | `dueDate` hoy, con hora ≠ medianoche |
| 🎯 Para hoy | `dueDate` hoy, sin hora específica |
| 📅 Esta semana | Próximos 7 días |
| ⏱ Próximamente | Próximos 30 días (colapsable) |
| 📥 Sin fecha | Sin `dueDate` (colapsable) |
| ✅ Completadas | Últimas 30 completadas (colapsadas) |

**Scoring:** prioridad + estado + si estás asignado (+300) + si sos creador (+50) + horas de retraso (máx 500).

**Quick action:** hacer clic en el círculo de estado → dropdown para cambiar el estado sin abrir el modal. Si la tarea es recurrente, activa la creación de la siguiente ocurrencia.

La hora de "ahora" se actualiza cada 60 segundos y cuando el usuario vuelve al foco de la pestaña — nunca se congela al medianoche.

---

### Calendario (`/dashboard/tareas/calendario`)

FullCalendar con vistas mes / semana / lista. Muestra todas las tareas que tienen `dueDate`. Características:
- Colores por prioridad o estado
- Clic en una tarea → abre el modal de detalle
- Tareas con hora muestran el horario exacto
- Drag & drop en el calendario para cambiar la fecha límite
- Proyección de tareas recurrentes futuras como "fantasmas"

---

### Cronograma / Gantt (`/dashboard/tareas/cronograma`)

Vista de línea de tiempo. Muestra las tareas con fecha de inicio y fin como barras horizontales. Útil para planificar proyectos largos y visualizar solapamientos.

---

### Eventos (`/dashboard/eventos`)

Eventos del calendario del negocio: reuniones, hitos, recordatorios que **no son tareas de trabajo**. Se crean y gestionan de forma independiente al módulo de tareas.

---

## Asistente IA (botón ✨)

El botón flotante **✨** (esquina inferior derecha) está disponible en todo el dashboard. Abre el panel del asistente:

- **Dictado por voz** — grabá una nota de voz y el sistema transcribe con Groq Whisper, luego un LLM extrae: título, prioridad, fecha, hora, asignados, etiquetas, recurrencia y horas estimadas. Se crea una tarea lista para revisar.
- **Texto libre** — escribí en lenguaje natural: "Reunión con Juan el viernes a las 10 — urgente". El LLM extrae los datos igual que con voz.
- **Chat** — hacé preguntas sobre el sistema o pedile al asistente que cree o busque tareas.

---

## Planificación

### Períodos / Ciclos (`/dashboard/planificacion`)

Los ciclos son **sprints** de trabajo con fecha de inicio y fin. Estados posibles:

```
Planificación → Activo → Completado → Cerrado
```

Solo puede haber **un ciclo activo** a la vez. Las tareas se asocian a un ciclo desde el formulario de tarea (campo "Período/Sprint"). Las tareas del ciclo activo aparecen en el sprint tab del Kanban.

---

### Objetivos (`/dashboard/planificacion/objetivos`)

Los objetivos son **épicas / OKRs** de alto nivel que agrupan tareas relacionadas. Campos:
- Nombre, descripción
- Progreso automático (0–100%) calculado a partir de las tareas vinculadas
- Estado: Activo / Completado / Archivado
- Fecha objetivo

Para vincular tareas a un objetivo: abrir una tarea → campo "Objetivo" en el formulario.

---

## Equipo (`/dashboard/equipo`)

Gestión de miembros del negocio.

### Invitar miembros
**Opción 1 — Por email:** ingresar el email y rol del nuevo miembro → llega un email con link de activación.

**Opción 2 — Por link:** generar un link de invitación reutilizable con:
- Fecha de vencimiento opcional
- Límite de usos opcional
- El link se puede compartir por WhatsApp, Slack, etc.

Al acceder al link (`/i/{token}`), el usuario puede crear cuenta, iniciar sesión o continuar con Google. **No** se crea un negocio propio en este flujo: el alta en el equipo ocurre al pulsar **Unirme al equipo** (`POST /api/invites/{token}/accept`). Después de aceptar, aparece el mensaje de éxito y el botón para ir al dashboard.

### Gestionar miembros
- Ver lista con rol, sector asignado y estado (activo / inactivo)
- Editar: cambiar rol, sector, activar/desactivar
- Eliminar con confirmación

---

### Sectores (`/dashboard/equipo/sectores`)

Locales, sucursales o áreas del negocio. Cada sector puede tener un responsable asignado. Las tareas pueden pertenecer a un sector para facilitar el filtrado.

---

### Roles personalizados (`/dashboard/equipo/roles`)

Los admins pueden crear roles custom que heredan de un rol base y ajustan permisos por módulo:

| Módulo | Permisos posibles |
|---|---|
| Tareas | leer, crear, editar, eliminar |
| Locales | leer, crear, editar, eliminar |
| Equipo | leer, invitar, editar, eliminar |
| Usuarios | leer, crear, editar |
| Reportes | leer |
| Facturación | leer |
| Adjuntos | subir, eliminar |

Los custom roles no pueden otorgar más permisos que el rol base del que heredan.

---

## Reportes (`/dashboard/reportes`)

Métricas del negocio:
- Distribución de tareas por estado (gráfico circular)
- Distribución por prioridad
- Actividad semanal últimas 6 semanas (barras)
- Carga de trabajo por miembro
- KPIs: tasa de completado, total, bloqueadas, urgentes activas

**Exportar Excel:** descarga un archivo `.xlsx` con hojas Resumen, Actividad, Por estado, Por prioridad, Equipo y Tareas. El selector Semana / Mes / Trimestre filtra la hoja Tareas. Requiere al menos una tarea en el espacio.

---

## Facturación (`/dashboard/billing`)

- **Plan actual** con límites: usuarios, sectores, proyectos, adjuntos/mes
- **Upgrade de plan** — checkout MercadoPago. Los cambios se activan al completar el pago.
- **Historial de facturas** — con estado y opción de descarga PDF
- **Cancelar suscripción** — al cancelar, el plan queda activo hasta el fin del período pagado

### Planes disponibles

| Plan | Usuarios | Sectores | Proyectos |
|---|---|---|---|
| Free | 3 | 1 | ilimitados |
| Basic | 10 | 3 | ilimitados |
| Pro | 50 | 10 | ilimitados |
| Enterprise | ilimitados | ilimitados | ilimitados |

Los precios los configura el superadmin desde `/superadmin/planes`.

---

## Configuración (`/dashboard/config`)

- **Datos del negocio**: nombre, logo
- **Notificaciones**: preferencias de email y push (tarea asignada, mención, alertas IA)
- **Perfil personal**: avatar, nombre, idioma, zona horaria, tema claro/oscuro
- **Layout del dashboard**: personalizar widgets del dashboard principal

---

## Ayuda (`/dashboard/ayuda`)

Centro de ayuda con documentación de cada sección en formato acordeón. Incluye guías de tareas repetitivas, checklist, sprint tabs, link de invitación y troubleshooting. Incluye el botón **"Ver tour"** que lanza el tour guiado interactivo desde cualquier página.

El tour también se puede iniciar desde cualquier parte de la app importando:
```ts
import { startOnboardingTour } from '@/components/layout/onboarding-tour';
startOnboardingTour();
```

---

## Notificaciones push

Si el navegador lo permite, el sistema envía notificaciones push (Firebase FCM) para:
- Tarea asignada
- Comentario en tarea donde participás
- Mención en comentario (`@tuusuario`)

El ícono de campana en el header muestra notificaciones no leídas. Hacer clic marca como leída y navega al recurso relacionado.

---

## Panel Superadmin (`/superadmin`)

Solo para emails en `SUPERADMIN_EMAILS` (TecnoFusión).

| Sección | Función |
|---|---|
| `/superadmin` | KPIs globales: negocios activos, usuarios, MRR |
| `/superadmin/businesses` | Listar, ver detalle, suspender/reactivar negocios |
| `/superadmin/businesses/[id]` | Usuarios, locales y suscripción de un negocio |
| `/superadmin/users` | Todos los usuarios del sistema (solo lectura) |
| `/superadmin/subscriptions` | Estado de suscripciones MercadoPago |
| `/superadmin/planes` | Editar precios y límites de cada plan sin deploy |
| `/superadmin/audit` | Últimas 200 acciones auditadas en el sistema |

### Configurar superadmin
1. Agregar email en `.env.local`: `SUPERADMIN_EMAILS=tu@email.com`
2. Registrarse con ese email en `/register`
3. El sistema auto-provisiona el user con `role: 'superadmin'`
4. El login redirige automáticamente a `/superadmin`

---

## Roles y permisos — resumen

| Rol | Puede |
|---|---|
| `superadmin` | Todo. Acceso total a la plataforma |
| `admin` | Gestión completa de su negocio: usuarios, tareas, billing, config |
| `responsable` | Gestiona su local: crea y edita tareas de su área, invita miembros |
| `miembro` | Crea y actualiza sus tareas, ve las del equipo |
| `viewer` | Solo lectura |

Los custom roles permiten ajustes granulares dentro de estas categorías.
