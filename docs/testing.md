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

// Mockear requireUser
vi.mock('@/lib/api/auth-helpers', () => ({
  requireUser: vi.fn(),
}));

// Mockear repositorio
vi.mock('@/repositories/index', () => ({
  taskRepository: {
    findAll: vi.fn(),
    create: vi.fn(),
  },
}));

describe('GET /api/tasks', () => {
  it('returns tasks for authenticated user', async () => {
    vi.mocked(requireUser).mockResolvedValue({
      uid: 'user-1',
      role: 'admin',
      businessId: 'biz-1',
      data: { /* User */ },
    });
    vi.mocked(taskRepository.findAll).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/tasks');
    const res = await GET(req);

    expect(res.status).toBe(200);
  });
});
```

### Componentes

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
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
import { createQueryWrapper } from './test-utils';

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

| Archivo | Qué cubre |
|---------|-----------|
| `api-tasks.test.ts` | CRUD de tareas, move, permisos |
| `api-members.test.ts` | CRUD de miembros |
| `api-locations.test.ts` | CRUD de locales |
| `api-superadmin.test.ts` | Endpoints superadmin |
| `audit.test.ts` | writeAuditLog |
| `auth-helpers.test.ts` | requireUser, manejo de tokens |
| `permissions-matrix.test.ts` | ROLE_MATRIX, can() |
| `permissions-resolve.test.ts` | resolvePermissions, custom roles |
| `permissions-tenant-guard.test.ts` | assertSameTenant, isSameTenant |
| `hooks-tasks-query.test.ts` | useTasksQuery |
| `hooks-members-query.test.ts` | useMembersQuery |
| `hooks-task-mutations.test.ts` | useCreateTask, useUpdateTask, etc. |
| `kanban-card.test.tsx` | KanbanCard component |
| `kanban-column.test.tsx` | KanbanColumn component |
| `member-card.test.tsx` | MemberCard component |
| `create-task-modal.test.tsx` | CreateTaskModal |
