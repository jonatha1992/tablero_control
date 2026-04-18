# 📖 Guía de Usuario - Tablero de Control

## Acceso al Sistema

### Inicio de Sesión
1. Navega a `http://localhost:3000`
2. Ingresa tu email y contraseña
3. Haz clic en "Iniciar sesión"

### Registro (solo admin puede crear usuarios)
1. Haz clic en "Regístrate" en la pantalla de login
2. Completa el formulario
3. El rol por defecto es "member" — los admins pueden cambiarlo en configuración

## Dashboard Principal

El dashboard es tu centro de control. Aquí encontrarás:

### KPIs (Indicadores Clave)
- **Tareas Activas**: Número total de tareas en progreso
- **Completadas Hoy**: Tareas finalizadas hoy
- **Bloqueadas**: Tareas que necesitan atención
- **Velocity**: Ritmo de completitud semanal

### Tareas Recientes
Lista de las últimas tareas creadas o modificadas con:
- Estado (Backlog, Por hacer, En progreso, En revisión, Completada, Bloqueada)
- Prioridad (Baja, Media, Alta, Urgente)
- Persona asignada

### Acciones Rápidas
Accesos directos a las secciones más usadas.

## Módulo de Tareas

> ⏳ En desarrollo

Cuando esté disponible podrás:
- **Vista Lista**: Tabla con sorting, filtros y bulk actions
- **Vista Kanban**: Columnas con drag & drop entre estados
- **Detalle**: Información completa de cada tarea, subtareas y comentarios

## Calendario

> ⏳ En desarrollo

Funcionalidades planificadas:
- **Vista Mes**: Calendario mensual con tareas marcadas
- **Vista Semana**: Time grid semanal
- **Vista Día**: Agenda detallada
- **Drag & Drop**: Mover tareas entre fechas
- **Recurring Tasks**: Tareas recurrentes (diaria, semanal, mensual)

## Reportes

> ⏳ En desarrollo

Tipos de reportes disponibles:
- **Diario**: Resumen de actividad del día
- **Semanal**: Análisis de la semana
- **Personalizado**: Reportes bajo demanda

## Equipo

> ⏳ En desarrollo

Gestión de miembros del equipo:
- Ver carga de trabajo por persona
- Asignar tareas
- Configurar roles y permisos

## Configuración

> ⏳ En desarrollo

Opciones del sistema:
- Preferencias de usuario (tema, notificaciones)
- Configuración de proyecto
- Integraciones

## Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+K` | Abrir búsqueda global |
| `Ctrl+N` | Nueva tarea |
| `Esc` | Cerrar modal |
| `?` | Ver atajos |

## Roles y Permisos

### Admin
- Gestión total del sistema
- Crear/eliminar usuarios
- Configurar integraciones
- Ver todos los datos

### Manager
- Crear/editar/eliminar tareas
- Ver reportes y métricas
- Asignar tareas al equipo
- Resolver alertas

### Member
- Ver tareas asignadas
- Actualizar estado de tareas propias
- Ver dashboard básico
- Recibir notificaciones

## Soporte

Para problemas o preguntas:
1. Revisa la documentación en `/docs`
2. Contacta al administrador del sistema
3. Revisa los logs en Firebase Emulator UI (`http://localhost:4000`)
