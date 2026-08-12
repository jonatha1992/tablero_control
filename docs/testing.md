# Testing — Tablero de Control

## Stack

- **Runner**: Vitest 4
- **Components**: Testing Library + jsdom
- **Mocks**: `vi.mock()` para Firebase Admin, Prisma, fetch
- **Setup**: `src/test/setup.ts`

## Ejecutar tests

```bash
# Watch mode (desarrollo)
npm test

# Ejecutar una vez
npm run test:run

# Un solo archivo
npx vitest run src/test/api-tasks.test.ts

# Con UI
npm run test:ui

# Coverage
npm run test:coverage
```

Los reportes generados por Playwright (`playwright-report/` y `test-results/`) son artefactos locales.
No deben versionarse; si se necesitan para depurar, compartirlos fuera del commit.

## Nomenclatura de archivos

| Patrón | Qué testea |
|--------|-----------|
| `api-*.test.ts` | API routes (Next.js route handlers) |
| `hooks-*.test.ts` | React Query hooks |
| `*.test.tsx` | Componentes React |
| `permissions-*.test.ts` | Lógica de permisos |
| `*.store.test.ts` | Stores Zustand |

## Patrones de test

### API routes

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/tasks/route';
import { requireUser } from '@/lib/api/auth-helpers';
import { prisma } from '@/lib/prisma';

vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

// authedUser SIEMPRE necesita el campo `data`
const authedUser = {
  uid: 'user-1',
  role: 'admin',
  businessId: 'biz-1',
  email: 'admin@biz.com',
  name: 'Admin',
  data: { id: 'user-1', role: 'admin', businessId: 'biz-1' }, // requerido
};

// Rutas que usan getTaskBusinessId() necesitan mock de prisma.task.findUnique
beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue(authedUser as never);
  vi.mocked(prisma.task.findUnique).mockResolvedValue({
    project: { businessId: 'biz-1' },
    location: null,
    creator: null,
  } as never);
});

describe('GET /api/tasks', () => {
  it('returns tasks for authenticated user', async () => {
    const req = new NextRequest('http://localhost/api/tasks?businessId=biz-1');
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
```

### Fixtures de usuario con memberships

Los fixtures de usuario deben incluir `memberships` activas: `GET /api/auth/profile` devuelve `404 not_invited` si no hay ninguna, y reasigna `businessId` desde la primera membresía si falta (ya no crea `Business` automáticamente):

```typescript
const dbUser = {
  id: 'uid-real',
  email: 'user@test.com',
  role: 'admin',
  businessId: 'biz-1',
  isActive: true,
  memberships: [{ businessId: 'biz-1', role: 'admin', isActive: true }], // requerido
};
```

Tests relacionados: `api-auth-profile`, `api-invites`, `api-auth-resolve`, `invite-username`, `invite-client`, `create-user-modal` y `create-invite-modal`. Cubren username generado visible/copiante y ausencia de nombre administrativo en ambos modales.

### Componentes

```typescript
import { render, screen } from '@testing-library/react';
import { KanbanCard } from '@/components/tareas/kanban-card';

describe('KanbanCard', () => {
  it('renders task title', () => {
    render(<KanbanCard task={mockTask} />);
    expect(screen.getByText(mockTask.title)).toBeInTheDocument();
  });
});
```

### Hooks React Query

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useTasksQuery } from '@/hooks/queries/use-tasks-query';

vi.mock('@/lib/api/tasks', () => ({
  tasksApi: { getAll: vi.fn().mockResolvedValue([]) },
}));

describe('useTasksQuery', () => {
  it('fetches tasks', async () => {
    const { result } = renderHook(() => useTasksQuery(), {
      wrapper: createQueryWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});
```

### Permisos

```typescript
import { can } from '@/lib/permissions/matrix';

describe('can()', () => {
  it('admin can create tasks', () => {
    expect(can({ role: 'admin' }, 'task.create')).toBe(true);
  });

  it('viewer cannot delete tasks', () => {
    expect(can({ role: 'viewer' }, 'task.delete')).toBe(false);
  });
});
```

## Archivos de test existentes

### API Routes

| Archivo | Qué cubre |
|---------|-----------|
| `api-tasks.test.ts` | GET /tasks (filtros, businessId, creatorId), POST /tasks (RBAC creatorId) |
| `api-task-detail.test.ts` | GET/PATCH/DELETE /tasks/[id], soporte legacy de subtareas |
| `api-comments.test.ts` | GET/POST /tasks/[id]/comments, 404 si tarea no existe |
| `api-time-entries.test.ts` | GET/POST /tasks/[id]/time-entries, validación hours > 0 |
| `api-members.test.ts` | CRUD de miembros, límite por plan (429) |
| `api-locations.test.ts` | CRUD de locales |
| `api-projects.test.ts` | CRUD de tableros, tenant guard |
| `api-projects-id.test.ts`, `service-project.test.ts`, `project-management-page.test.tsx` | archivar/restaurar, último activo, cupo y UI |
| `sidebar-sites-navigation.test.tsx`, `header-user-menu.test.tsx` | navegación Sedes y menú personal del header |
| `api-cycles.test.ts` | CRUD de ciclos, cross-tenant task injection guard |
| `api-objectives.test.ts` | CRUD de objetivos, cross-tenant task injection guard |
| `api-business.test.ts` | GET config, subscription |
| `api-superadmin.test.ts` | Endpoints superadmin (businesses, users, metrics, audit) |
| `api-auth-profile.test.ts` | GET /auth/profile — find by UID, link by email, superadmin auto-provisioning |
| `api-auth-register.test.ts` | POST /auth/register — alta nueva, idempotente, heal sin membership, Firestore roles best-effort |
| `api-upload.test.ts` | POST /upload — avatar, attachment, tenant guard |

### Helpers de dominio

| Archivo | Qué cubre |
|---------|-----------|
| `task-status.test.ts` | Criterio compartido de tareas pendientes/accionables: excluye backlog, done, archived y futuras según vista |

### Auth & Permisos

| Archivo | Qué cubre |
|---------|-----------|
| `auth-helpers.test.ts` | requireUser — token válido, 401, carga User desde PG |
| `permissions-matrix.test.ts` | ROLE_MATRIX, can() por rol |
| `permissions-resolve.test.ts` | resolvePermissions, custom roles con PermissionSet |
| `permissions-tenant-guard.test.ts` | assertSameTenant, isSameTenant, assertResourceBelongsToBusiness |
| `audit.test.ts` | writeAuditLog — todas las acciones auditadas |

### Hooks

| Archivo | Qué cubre |
|---------|-----------|
| `hooks-tasks-query.test.ts` | useTasksQuery |
| `hooks-members-query.test.ts` | useMembersQuery |
| `hooks-task-mutations.test.ts` | useCreateTask, useUpdateTask, useMoveTask, useDeleteTask |

### Componentes

| Archivo | Qué cubre |
|---------|-----------|
| `kanban-card.test.tsx` | KanbanCard — render, prioridad, fecha, hora |
| `kanban-column.test.tsx` | KanbanColumn — lista de cards, drop zone |
| `member-card.test.tsx` | MemberCard |
| `create-task-modal.test.tsx` | CreateTaskModal — formulario, submit, validación |
| `task-filter-bar.test.tsx` | TaskFilterBar — filtros de Agenda/Calendario, onChange/onClear, toggle ocultar finalizadas |
| `dropdown-menu-zindex.test.tsx` | Regresión: DropdownMenuContent z-[320] por encima del Dialog (z-300/310) |
| `task-filters.test.ts` | matchesTaskFilters / hasActiveFilters — predicado puro por dimensión y combinado |
| `task-filters-ui-store.test.ts` | useTaskFiltersUIStore — defaults por vista, merge, clear |

### Servicios

| Archivo | Qué cubre |
|---------|-----------|
| `task-service.test.ts` | TaskService.createTask, moveTask (recurrencia) |
| `comment-service.test.ts` | CommentService.addComment |
| `time-entry-service.test.ts` | TimeEntryService.create, validación |
