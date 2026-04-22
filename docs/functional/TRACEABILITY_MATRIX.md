# Matriz de Trazabilidad (Tablero de Control)

Esta matriz vincula los Requisitos Funcionales (RF) definidos en la documentación de negocio con su implementación técnica en la base de código.

| ID Requisito | Descripción | Componente UI | Servicio / Logic | Repositorio / Driver |
|---|---|---|---|---|
| **RF-001** | Multi-tenancy (Aislamiento) | — | Global Context / Headers | `PrismaUserRepository`, `PrismaTaskRepository` (filters) |
| **RF-002** | Gestión de Locales y Equipos | `LocationFilter`, `TeamSettings` | `locationService`, `teamService` | `PrismaLocationRepository`, `PrismaTeamRepository` |
| **RF-003** | Control de Roles (RBAC) | `ProtectedRoute`, `RoleBadge` | `src/lib/constants/user.ts` | `src/lib/firebase/auth.ts` |
| **RF-004** | Tablero Kanban | `KanbanBoard`, `KanbanCard` | `useTasksQuery`, `useMoveTask` | `PrismaTaskRepository` |
| **RF-005** | Creación de Tareas | `CreateTaskModal` | `taskService.createTask` | `PrismaTaskRepository.create` |
| **RF-006** | Detalle y Edición de Tareas | `TaskDetailModal` | `taskService.updateTask` | `PrismaTaskRepository.update` |
| **RF-007** | Archivos Adjuntos | `TaskAttachments` | `uploadTaskAttachment` (Storage) | `lib/firebase/storage.ts` |
| **RF-008** | Comentarios en Tareas | `TaskComments` (en Detalle) | — | `Comment` model en Prisma |
| **RF-009** | Autenticación (Email/OAuth) | `LoginForm`, `RegisterForm` | `authService` | `lib/firebase/auth.ts` |
| **RF-010** | Auditoría (Logs) | — | `auditLogService` (AuditLog) | `prisma/schema.prisma` (AuditLog) |

## Notas de Verificación Técnica
- Los repositorios en `src/repositories/prisma/` implementan las interfaces definidas en `src/repositories/interfaces/`, asegurando que la lógica de negocio (Services) sea agnóstica a la base de datos.
- Las mutaciones de React Query (`src/hooks/mutations/`) actúan como orquestadores entre la UI y los servicios.
- La validación de roles ocurre en el cliente (`src/hooks/auth-context.tsx`) y debe ser reforzada en el servidor (API Routes) usando el token de Firebase.
