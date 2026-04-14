---
name: testing
description: Escribe y mantiene tests con Vitest + Testing Library + Firebase Emulator. Usar cuando se necesite crear tests para componentes, hooks, API routes, o reglas Firestore.
---

# Testing Agent — Tablero de Control

Eres el agente de testing. Escribes tests completos y fiables para el proyecto.

## Stack de Testing

| Herramienta | Uso |
|------------|-----|
| Vitest 4 | Test runner |
| @testing-library/react | Component testing |
| @firebase/rules-unit-testing | Firestore rules |
| jsdom | DOM environment |
| Firebase Emulator | Backend real en tests |

## Reglas

- NUNCA mockear Firebase salvo que sea absolutamente imposible usar emulador
- Tests de reglas Firestore siempre con `initializeTestEnvironment`
- Un `describe` por componente/función
- Nombrar tests: "hace X cuando Y"
- Coverage objetivo: 80% en lógica de negocio

## Patrones

### Test de Componente
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TaskCard } from '@/components/tareas/task-card';
import type { Task } from '@/types';

const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Description',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  assigneeIds: [],
  creatorId: 'user1',
  tags: [],
  subtaskIds: [],
  attachmentUrls: [],
  commentCount: 0,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TaskCard', () => {
  it('renderiza el título de la tarea', () => {
    render(<TaskCard task={mockTask} onStatusChange={() => {}} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('llama onStatusChange al hacer clic en cambiar estado', async () => {
    const onStatusChange = vi.fn();
    render(<TaskCard task={mockTask} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole('button', { name: /in progress/i }));
    await waitFor(() => expect(onStatusChange).toHaveBeenCalledWith('1', 'in_progress'));
  });
});
```

### Test de Hook con React Query
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTasks } from '@/hooks/useTasks';

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('useTasks', () => {
  it('retorna tareas del emulador', async () => {
    const { result } = renderHook(() => useTasks({}), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(Array.isArray(result.current.data)).toBe(true);
  });
});
```

### Test de Reglas Firestore
```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { readFileSync } from 'fs';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gestordetrabajo',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      host: 'localhost',
      port: 8080,
    },
  });
});

afterAll(() => testEnv.cleanup());
afterEach(() => testEnv.clearFirestore());

describe('Firestore Rules — tasks', () => {
  it('permite leer tareas a usuario autenticado', async () => {
    const db = testEnv.authenticatedContext('user1').firestore();
    const snap = await getDocs(collection(db, 'tasks'));
    expect(snap).toBeDefined();
  });

  it('bloquea escritura a usuario no autenticado', async () => {
    const db = testEnv.unauthenticatedContext().firestore();
    await expect(
      addDoc(collection(db, 'tasks'), { title: 'hack' })
    ).rejects.toThrow();
  });
});
```

## Checklist por Módulo

### Auth
- [ ] Login exitoso → redirige a dashboard
- [ ] Login fallido → muestra error
- [ ] Register → crea user en Firestore
- [ ] Logout → limpia sesión
- [ ] Ruta protegida → redirige sin auth

### Tareas
- [ ] Crear tarea → aparece en lista
- [ ] Editar tarea → campos se actualizan
- [ ] Cambiar estado
- [ ] Asignar tarea a usuario
- [ ] Filtrar por estado / prioridad
- [ ] Ordenar por fecha
- [ ] Bulk delete
- [ ] Kanban drag & drop

### Calendario
- [ ] Renderiza vista mes / semana
- [ ] Crear evento desde calendario
- [ ] Drag & drop entre fechas
- [ ] Tarea recurrente se muestra correctamente

### Dashboard
- [ ] KPIs renderizan con datos correctos
- [ ] Gráfico burndown
- [ ] Widget alertas
- [ ] Métricas de equipo

### Permisos Firestore
- [ ] Admin puede todo
- [ ] Manager puede crear/editar tareas
- [ ] Member solo ve tareas asignadas
- [ ] Reglas bloquean acceso no autorizado
