# Plan de Implementación Completo
## Tablero de Control — Unión Jira + Trello (Uso Genérico Multi-Negocio)

> Fecha: 2026-05-04  
> Estado: **Fases 1-5 implementadas. Fase 6 (Documentación) en curso.**  
> Objetivo: Llevar el sistema al máximo nivel de funcionalidad genérica posible.

---

## 📋 Índice de Fases

1. [FASE 1: Colaboración Operativa](#fase-1-colaboración-operativa) ✅
2. [FASE 2: Períodos de Trabajo (Ciclos)](#fase-2-períodos-de-trabajo-ciclos) ✅
3. [FASE 3: Agrupadores / Objetivos](#fase-3-agrupadores--objetivos) ✅
4. [FASE 4: Múltiples Tableros](#fase-4-múltiples-tableros) ✅
5. [FASE 5: Time Tracking + Cronograma](#fase-5-time-tracking--cronograma) ✅
6. [FASE 6: Documentación](#fase-6-documentación) 🔄

---

## FASE 1: Colaboración Operativa
**Duración estimada:** 1-2 días  
**Valor:** Los usuarios pueden coordinarse en las tareas, el sistema pasa de ser un tablero solitario a una herramienta de equipo.

### 1.1 Comentarios en Tareas
**Estado:** Modelo Prisma `Comment` existe. Sin API ni UI.  
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Crear interfaz `ICommentRepository` | `src/repositories/interfaces/ICommentRepository.ts` | 15 min |
| Crear implementación `PrismaCommentRepository` | `src/repositories/prisma/comment.repository.ts` | 30 min |
| Exportar repositorio en `index.ts` | `src/repositories/index.ts` | 5 min |
| Crear `CommentService` | `src/services/comment.service.ts` | 20 min |
| Crear API route `GET/POST /api/tasks/[id]/comments` | `src/app/api/tasks/[id]/comments/route.ts` | 30 min |
| Crear API route `DELETE /api/comments/[id]` | `src/app/api/comments/[id]/route.ts` | 20 min |
| Crear `commentsApi` en cliente | `src/lib/api/comments.ts` | 15 min |
| Crear hooks `useCommentsQuery` y `useCreateComment` | `src/hooks/queries/use-comments-query.ts`, `src/hooks/mutations/use-create-comment.ts` | 20 min |
| Integrar comentarios en `TaskDetailModal` | `src/components/tareas/task-detail-modal.tsx` | 45 min |
| Notificaciones push + email al comentar | Reutilizar `sendNotification` y `MailService` | 30 min |
| **TOTAL** | | **~3.5 horas** |

### 1.2 Subtareas / Items de Tarea con Progreso
**Estado:** Modelo Prisma `Task` tiene `parentId` y `subtasks[]`. Sin UI de gestión.  
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Agregar campo `checklist` JSON al schema Prisma | `prisma/schema.prisma` | 15 min |
| Crear migración Prisma | Comando `npx prisma migrate dev` | 10 min |
| Extender `taskService` para CRUD de subtareas | `src/services/task.service.ts` | 30 min |
| Extender API `GET /api/tasks/[id]/subtasks` | `src/app/api/tasks/[id]/subtasks/route.ts` | 20 min |
| Sección de subtareas en `TaskDetailModal` | `src/components/tareas/task-detail-modal.tsx` | 45 min |
| Barra de progreso visual (padre) | Componente nuevo `TaskProgressBar` | 20 min |
| Mostrar contador de subtareas en `KanbanCard` | `src/components/tareas/kanban-card.tsx` | 15 min |
| **TOTAL** | | **~2.5 horas** |

### 1.3 Checklist Rápido Inline (Trello-style)
**Estado:** No existe.  
**Complejidad:** Baja

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Usar campo `checklist` JSON en Task | Ya incluido en 1.2 | — |
| Componente `TaskChecklist` editable | `src/components/tareas/task-checklist.tsx` | 30 min |
| Integrar en `TaskDetailModal` | `src/components/tareas/task-detail-modal.tsx` | 15 min |
| **TOTAL** | | **~45 min** |

### 1.4 Menciones @usuario en Comentarios
**Estado:** No existe.  
**Complejidad:** Baja

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Parsear `@nombre` en contenido de comentario | Helper `parseMentions` | 15 min |
| Buscar usuarios mencionados por nombre/email | Query en servicio | 15 min |
| Enviar notificación a usuarios mencionados | Reutilizar `sendNotification` | 15 min |
| Autocompletado @ en textarea de comentarios | Componente `MentionTextarea` | 30 min |
| **TOTAL** | | **~1.25 horas** |

### Resumen FASE 1
**Tiempo total estimado:** 1-2 días  
**Entregables:**
- Usuarios pueden comentar en tareas con hilos de conversación
- Subtareas jerárquicas con barra de progreso
- Checklists rápidos inline (estilo Trello)
- Menciones @usuario con notificaciones
- El kanban muestra contadores de subtareas en las cards

---

## FASE 2: Períodos de Trabajo (Ciclos)
**Duración estimada:** 2-3 días  
**Valor:** Permite planificación por semanas, quincenas, meses o temporadas. Aplicable a cualquier industria.

### 2.1 Modelo de Datos Cycle
**Estado:** No existe.  
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Crear modelo `Cycle` en Prisma schema | `prisma/schema.prisma` | 20 min |
| Agregar `cycleId` nullable a `Task` | `prisma/schema.prisma` | 10 min |
| Ejecutar migración | `npx prisma migrate dev` | 10 min |
| Actualizar types de dominio | `src/types/domain/cycle.ts` | 15 min |
| Actualizar DTOs | `src/types/dto/cycle.dto.ts` | 15 min |
| **TOTAL** | | **~1.2 horas** |

### 2.2 Repositorio y Servicio Cycle
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Interfaz `ICycleRepository` | `src/repositories/interfaces/ICycleRepository.ts` | 10 min |
| Implementación `PrismaCycleRepository` | `src/repositories/prisma/cycle.repository.ts` | 30 min |
| Exportar en `index.ts` | `src/repositories/index.ts` | 5 min |
| `CycleService` con lógica de negocio | `src/services/cycle.service.ts` | 30 min |
| **TOTAL** | | **~1.2 horas** |

### 2.3 API de Ciclos
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| `GET /api/cycles` — listar por equipo/negocio | `src/app/api/cycles/route.ts` | 20 min |
| `POST /api/cycles` — crear ciclo | `src/app/api/cycles/route.ts` | 20 min |
| `PATCH /api/cycles/[id]` — editar/estado | `src/app/api/cycles/[id]/route.ts` | 20 min |
| `POST /api/cycles/[id]/tasks` — asignar/quitar tareas | `src/app/api/cycles/[id]/tasks/route.ts` | 25 min |
| `POST /api/cycles/[id]/start` — iniciar ciclo | `src/app/api/cycles/[id]/start/route.ts` | 15 min |
| `POST /api/cycles/[id]/complete` — cerrar ciclo | `src/app/api/cycles/[id]/complete/route.ts` | 20 min |
| `cyclesApi` en cliente | `src/lib/api/cycles.ts` | 20 min |
| **TOTAL** | | **~2.3 horas** |

### 2.4 UI de Ciclos
**Complejidad:** Alta

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Página `/dashboard/ciclos` | `src/app/dashboard/ciclos/page.tsx` | 45 min |
| Componente `CycleList` | `src/components/ciclos/cycle-list.tsx` | 30 min |
| Componente `CycleCard` con progreso | `src/components/ciclos/cycle-card.tsx` | 30 min |
| Modal crear/editar ciclo | `src/components/ciclos/cycle-modal.tsx` | 30 min |
| Selector de ciclo activo en Kanban | `src/components/tareas/kanban-board.tsx` | 20 min |
| Vista filtrada "Solo este ciclo" | `src/components/tareas/kanban-board.tsx` | 15 min |
| Hooks `useCyclesQuery`, `useCreateCycle`, etc. | `src/hooks/queries/use-cycles-query.ts`, etc. | 30 min |
| **TOTAL** | | **~3.3 horas** |

### 2.5 Gráfico de Avance del Período
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Endpoint `GET /api/cycles/[id]/progress` | `src/app/api/cycles/[id]/progress/route.ts` | 20 min |
| Gráfico de línea: tareas totales vs completadas | `src/components/ciclos/cycle-burndown.tsx` | 30 min |
| Integrar en página de ciclos | `src/app/dashboard/ciclos/page.tsx` | 15 min |
| **TOTAL** | | **~1 hora** |

### Resumen FASE 2
**Tiempo total estimado:** 2-3 días  
**Entregables:**
- Planificación por períodos de trabajo (semanas, quincenas, meses, temporadas)
- Asignación de tareas a ciclos
- Gráfico de avance del período
- Selector de ciclo activo en el kanban
- Cierre de ciclo con resumen

---

## FASE 3: Agrupadores / Objetivos
**Duración estimada:** 1-2 días  
**Valor:** Permite agrupar tareas en iniciativas grandes: aperturas, campañas, reformas.

### 3.1 Modelo de Datos Objective
**Estado:** No existe.  
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Crear modelo `Objective` en Prisma | `prisma/schema.prisma` | 20 min |
| Agregar `objectiveId` nullable a `Task` | `prisma/schema.prisma` | 10 min |
| Migración Prisma | `npx prisma migrate dev` | 10 min |
| Types y DTOs | `src/types/domain/objective.ts`, `src/types/dto/objective.dto.ts` | 20 min |
| **TOTAL** | | **~1 hora** |

### 3.2 Backend Objective
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Repositorio (`IObjectiveRepository`, `PrismaObjectiveRepository`) | Nuevos archivos + `index.ts` | 40 min |
| `ObjectiveService` | `src/services/objective.service.ts` | 30 min |
| API: `GET/POST /api/objectives` | `src/app/api/objectives/route.ts` | 25 min |
| API: `PATCH/DELETE /api/objectives/[id]` | `src/app/api/objectives/[id]/route.ts` | 25 min |
| API: `POST /api/objectives/[id]/tasks` | `src/app/api/objectives/[id]/tasks/route.ts` | 20 min |
| Cliente `objectivesApi` | `src/lib/api/objectives.ts` | 15 min |
| **TOTAL** | | **~2.3 horas** |

### 3.3 UI de Objetivos
**Complejidad:** Alta

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Página `/dashboard/objetivos` | `src/app/dashboard/objetivos/page.tsx` | 30 min |
| Componente `ObjectiveList` con progreso | `src/components/objetivos/objective-list.tsx` | 30 min |
| Modal crear/editar objetivo | `src/components/objetivos/objective-modal.tsx` | 30 min |
| Filtro por objetivo en Kanban | `src/components/tareas/kanban-board.tsx` | 20 min |
| Badge de objetivo en `KanbanCard` | `src/components/tareas/kanban-card.tsx` | 15 min |
| Hooks React Query | `src/hooks/queries/use-objectives-query.ts`, etc. | 25 min |
| **TOTAL** | | **~2.5 horas** |

### 3.4 Vista Timeline de Objetivos (básica)
**Complejidad:** Media

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Componente `ObjectiveTimeline` | `src/components/objetivos/objective-timeline.tsx` | 45 min |
| Integrar en página de objetivos | `src/app/dashboard/objetivos/page.tsx` | 15 min |
| **TOTAL** | | **~1 hora** |

### Resumen FASE 3
**Tiempo total estimado:** 1-2 días  
**Entregables:**
- Objetivos/Iniciativas con nombre, descripción, color y fecha objetivo
- Progreso automático (% de tareas completadas)
- Filtro por objetivo en el kanban
- Vista timeline básica
- Badges de objetivo en las cards

---

## FASE 4: Múltiples Tableros
**Duración estimada:** 1-2 días  
**Valor:** Cada local, equipo o proyecto tiene su propio tablero con columnas propias.

### 4.1 Modelo de Datos Board + BoardColumn
**Estado:** No existe.  
**Complejidad:** Media-Alta

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Crear modelo `Board` en Prisma | `prisma/schema.prisma` | 25 min |
| Crear modelo `BoardColumn` en Prisma | `prisma/schema.prisma` | 20 min |
| Agregar `boardId` nullable a `Task` | `prisma/schema.prisma` | 10 min |
| Migración + seed de board default por negocio | `npx prisma migrate dev`, script opcional | 30 min |
| Types y DTOs | `src/types/domain/board.ts`, `src/types/dto/board.dto.ts` | 25 min |
| **TOTAL** | | **~1.8 horas** |

### 4.2 Backend Board
**Complejidad:** Media-Alta

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Repositorio (`IBoardRepository`, `PrismaBoardRepository`) | Nuevos archivos + `index.ts` | 45 min |
| `BoardService` | `src/services/board.service.ts` | 30 min |
| API: `GET/POST /api/boards` | `src/app/api/boards/route.ts` | 25 min |
| API: `PATCH/DELETE /api/boards/[id]` | `src/app/api/boards/[id]/route.ts` | 25 min |
| API: CRUD columnas `POST /api/boards/[id]/columns` | `src/app/api/boards/[id]/columns/route.ts` | 25 min |
| Cliente `boardsApi` | `src/lib/api/boards.ts` | 20 min |
| **TOTAL** | | **~2.7 horas** |

### 4.3 UI de Tableros
**Complejidad:** Alta

| Subtarea | Archivos a crear/modificar | Esfuerzo |
|---|---|---|
| Selector de board en `/dashboard/tareas` | `src/components/tareas/board-selector.tsx` | 30 min |
| Configuración de columnas (CRUD + reordenar) | `src/components/tareas/board-column-config.tsx` | 45 min |
| Adaptar `KanbanBoard` para leer columnas del board activo | `src/components/tareas/kanban-board.tsx` | 30 min |
| Adaptar `KanbanColumn` para usar columnas dinámicas | `src/components/tareas/kanban-column.tsx` | 20 min |
| Límite WIP por columna (opcional) | `src/components/tareas/kanban-column.tsx` | 20 min |
| Página `/dashboard/tableros` para gestionar boards | `src/app/dashboard/tableros/page.tsx` | 30 min |
| Hooks React Query | `src/hooks/queries/use-boards-query.ts`, etc. | 25 min |
| **TOTAL** | | **~3.3 horas** |

### Resumen FASE 4
**Tiempo total estimado:** 1-2 días  
**Entregables:**
- Múltiples tableros por negocio (por local, equipo o proyecto)
- Columnas configurables por tablero
- Selector de tablero en la vista de tareas
- Límite WIP por columna
- Board default automático para negocios existentes

---

## FASE 5: Time Tracking + Cronograma
**Duración estimada:** 2-3 días  
**Estado:** ✅ **Implementada**  
**Valor:** Control de horas por tarea y planificación visual en timeline.

> **Nota:** Los "Flujos custom" y "Automaciones" del plan original fueron pospuestos a FASE 6+ debido a su alta complejidad (requieren migrar `TaskStatus` de enum Prisma a string custom, y un motor de reglas respectivamente).

### 5.1 Registro de Tiempos (Time Tracking) ✅
**Estado:** Implementado.

| Subtarea | Estado | Archivos |
|---|---|---|
| Modelo `TimeEntry` en Prisma | ✅ | `prisma/schema.prisma` |
| API `GET/POST /api/tasks/[id]/time-entries` | ✅ | `src/app/api/tasks/[id]/time-entries/route.ts` |
| API `DELETE /api/time-entries/[id]` | ✅ | `src/app/api/time-entries/[id]/route.ts` |
| Servicio `TimeEntryService` | ✅ | `src/services/time-entry.service.ts` |
| UI `TaskTimeTracking` en modal | ✅ | `src/components/tareas/task-time-tracking.tsx` |
| Integración en `TaskDetailModal` | ✅ | `src/components/tareas/task-detail-modal.tsx` |

### 5.2 Vista Timeline / Cronograma (Gantt) ✅
**Estado:** Implementado con FullCalendar resource-timeline.

| Subtarea | Estado | Archivos |
|---|---|---|
| Instalar plugins FullCalendar Timeline | ✅ | `package.json` |
| Componente `GanttView` | ✅ | `src/components/tareas/gantt-view.tsx` |
| Página `/dashboard/cronograma` | ✅ | `src/app/dashboard/cronograma/page.tsx` |
| Agrupación por tablero/objetivo/asignado | ✅ | `GanttView` |
| Link en Sidebar | ✅ | `src/components/layout/sidebar.tsx` |

### Resumen FASE 5
**Entregables implementados:**
- Registro de tiempos con logs de horas y progreso vs estimado
- Vista Gantt / Cronograma con agrupación y filtros

**Pendiente para FASE 6+:**
- Flujos de trabajo custom por tablero (aprobacioes, restricciones de estado)
- Automaciones simples (motor de reglas: triggers + actions)

---

## FASE 6: Documentación
**Duración estimada:** 1 día  
**Estado:** 🔄 **En curso**  
**Valor:** Calidad, confianza, mantenibilidad.

### 6.1 Documentación Actualizada ✅

| Subtarea | Estado | Archivos |
|---|---|---|
| Actualizar `AGENTS.md` con nuevos modelos, APIs, servicios, hooks | ✅ | `AGENTS.md` |
| Actualizar `README.md` con features implementadas (FASE 1-5) | ✅ | `README.md` |
| Actualizar `docs/architecture.md` | ✅ | `docs/architecture.md` |
| Actualizar `docs/development.md` | ✅ | `docs/development.md` |
| Actualizar `docs/functional/GLOSSARY_AND_MODELS.md` | ✅ | `docs/functional/GLOSSARY_AND_MODELS.md` |
| Actualizar `docs/functional/SCOPE_AND_REQUIREMENTS.md` | ✅ | `docs/functional/SCOPE_AND_REQUIREMENTS.md` |
| Actualizar `docs/IMPLEMENTATION_PLAN.md` | ✅ | `docs/IMPLEMENTATION_PLAN.md` |

### 6.2 Tests E2E (Pendiente)

| Subtarea | Estado |
|---|---|
| Tests de comentarios (crear, listar, eliminar) | ⏳ |
| Tests de subtareas y checklists | ⏳ |
| Tests de ciclos (crear, asignar tareas, cerrar) | ⏳ |
| Tests de objetivos | ⏳ |
| Tests de múltiples tableros | ⏳ |
| Tests de time tracking | ⏳ |
| Tests de cronograma | ⏳ |

### Resumen FASE 6
**Entregables completados:**
- Documentación técnica actualizada (AGENTS.md, README.md, architecture.md, development.md)
- Documentación funcional actualizada (GLOSSARY, SCOPE_AND_REQUIREMENTS, IMPLEMENTATION_PLAN)

**Pendiente:**
- Tests E2E de las nuevas features (Playwright specs)

---

## 📊 Resumen Global

| Fase | Días | Horas | Features principales |
|---|---|---|---|
| FASE 1: Colaboración | 1-2 | ~8 | Comentarios, subtareas, checklists, menciones @usuario |
| FASE 2: Ciclos | 2-3 | ~12 | Períodos de trabajo (planning/active/completed/closed) |
| FASE 3: Objetivos | 1-2 | ~7 | Agrupadores con progreso % y fecha objetivo |
| FASE 4: Tableros | 1-2 | ~8 | Múltiples tableros por negocio (reusa modelo Project) |
| FASE 5: Time Tracking + Gantt | 1-2 | ~6 | Registro de horas, vista cronograma con FullCalendar |
| FASE 6: Documentación | 0.5-1 | ~3 | Docs técnicas y funcionales actualizadas |
| **TOTAL** | **7-12 días** | **~46 horas** | **Sistema genérico completo** |

---

## 🎯 Priorización Recomendada

Si el tiempo es limitado, este es el orden de máximo valor/impacto:

1. **FASE 1 (obligatoria)** — Sin comentarios y subtareas, el sistema no es colaborativo.
2. **FASE 4 (alto impacto)** — Múltiples tableros es lo que diferencia a Trello y permite escalar.
3. **FASE 3 (alto impacto)** — Objetivos dan contexto de negocio a las tareas.
4. **FASE 2 (medio impacto)** — Ciclos sirven para equipos que planifican, pero Kanban puro funciona sin ellos.
5. **FASE 5 (impacto medio-bajo)** — Features avanzadas para usuarios power-users.

---

## 🗂️ Nuevos Archivos a Crear (aproximado)

| Categoría | Cantidad | Ejemplos |
|---|---|---|
| Modelos Prisma | 4 | Cycle, Objective, Board, BoardColumn |
| Repositorios (interfaces + prisma) | 8 | ICommentRepository, ICycleRepository, etc. |
| Servicios | 5 | comment.service.ts, cycle.service.ts, etc. |
| API Routes | ~18 | /api/cycles, /api/objectives, /api/boards, etc. |
| Componentes UI | ~20 | CycleList, ObjectiveCard, BoardSelector, GanttView, etc. |
| Hooks React Query | ~15 | useCyclesQuery, useObjectivesQuery, etc. |
| API Clients | 4 | cyclesApi, objectivesApi, boardsApi, commentsApi |
| Pages (App Router) | 4 | /dashboard/ciclos, /dashboard/objetivos, /dashboard/cronograma, etc. |

**Total archivos nuevos:** ~80 archivos  
**Archivos a modificar:** ~25 archivos existentes

---

## ✅ Checklist de Progreso

### FASE 1: Colaboración Operativa ✅
- [x] Comentarios en tareas (API + UI)
- [x] Subtareas jerárquicas (API + UI)
- [x] Checklist inline con progreso
- [x] Menciones @usuario en comentarios

### FASE 2: Períodos de Trabajo (Ciclos) ✅
- [x] Modelo Cycle + migración
- [x] API y UI de Ciclos
- [x] Selector de ciclo en Kanban

### FASE 3: Agrupadores / Objetivos ✅
- [x] Modelo Objective + migración
- [x] API y UI de Objetivos
- [x] Filtro por objetivo en Kanban

### FASE 4: Múltiples Tableros ✅
- [x] Modelo Project ajustado (teamId opcional)
- [x] API y UI de Tableros (CRUD + limitProjects)
- [x] Selector de tablero en Kanban
- [x] Filtrado por projectId en API de tareas

### FASE 5: Time Tracking + Cronograma ✅
- [x] Modelo TimeEntry + migración
- [x] API y UI de registro de tiempos
- [x] Vista Gantt/Cronograma (FullCalendar resource-timeline)
- [ ] Flujos de trabajo custom (pospuesto — requiere migrar TaskStatus enum)
- [ ] Automaciones simples (pospuesto — requiere motor de reglas)

### FASE 6: Documentación 🔄
- [x] AGENTS.md actualizado
- [x] README.md actualizado
- [x] docs/architecture.md actualizado
- [x] docs/development.md actualizado
- [x] docs/functional/ actualizado
- [ ] Tests E2E de nuevas features
- [ ] Tests unitarios de nuevos servicios
