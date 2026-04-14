# 🧪 Testing Guide - Tablero de Control

## Setup

### Stack de Testing
- **Runner**: Vitest
- **Components**: Testing Library
- **Backend**: Firebase Emulator
- **DOM**: jsdom

### Configuración

Crear `vitest.config.ts` en la raíz:

```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

Crear `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest';

// Mock Firebase
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
  useEmulators: true,
}));
```

## Ejecutar Tests

```bash
# Watch mode (desarrollo)
npm test

# Ejecutar una vez
npm run test:run

# Con UI
npm run test:ui

# Coverage
npm run test:coverage
```

## Patrones de Test

### Componentes

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from '@/components/tareas/task-card';

describe('TaskCard', () => {
  it('renders task title and status', () => {
    const task = { /* mock task data */ };
    render(<TaskCard task={task} onStatusChange={() => {}} />);
    
    expect(screen.getByText(task.title)).toBeInTheDocument();
    expect(screen.getByText(task.status)).toBeInTheDocument();
  });

  it('calls onStatusChange when button clicked', () => {
    const onStatusChange = vi.fn();
    const task = { /* mock task data */ };
    
    render(<TaskCard task={task} onStatusChange={onStatusChange} />);
    fireEvent.click(screen.getByRole('button', { name: /mover/i }));
    
    expect(onStatusChange).toHaveBeenCalled();
  });
});
```

### Firebase Rules

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { readFileSync } from 'fs';

describe('Firestore Security Rules', () => {
  it('denies read tasks to unauthenticated users', async () => {
    const env = await initializeTestEnvironment({
      projectId: 'gestordetrabajo',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });

    const unauthDb = env.unauthenticatedContext().firestore();
    
    await assertFails(
      getDocs(collection(unauthDb, 'tasks'))
    );
  });

  it('allows member to read assigned tasks', async () => {
    const env = await initializeTestEnvironment({
      projectId: 'gestordetrabajo',
      firestore: {
        rules: readFileSync('firestore.rules', 'utf8'),
      },
    });

    const memberDb = env.authenticatedContext('member-uid').firestore();
    
    await assertSucceeds(
      getDocs(collection(memberDb, 'tasks'))
    );
  });
});
```

### Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '@/stores/task-store';

describe('useTaskStore', () => {
  it('initializes with empty tasks', () => {
    const { result } = renderHook(() => useTaskStore());
    
    expect(result.current.tasks).toEqual([]);
  });

  it('sets tasks', () => {
    const { result } = renderHook(() => useTaskStore());
    const tasks = [{ id: '1', title: 'Test' }];
    
    act(() => {
      result.current.setTasks(tasks);
    });
    
    expect(result.current.tasks).toEqual(tasks);
  });
});
```

## Test Cases por Módulo

### ✅ Auth
- [ ] Login con credenciales válidas
- [ ] Login con credenciales inválidas
- [ ] Register crea usuario en Firestore
- [ ] Logout limpia sesión
- [ ] Protected route redirige sin auth
- [ ] Role-based access funciona

### ✅ Layout
- [ ] Sidebar renders
- [ ] Sidebar collapse/expand
- [ ] Mobile menu toggle
- [ ] Active nav item highlight
- [ ] Header search input
- [ ] Notification badge count

### ⏳ Tareas (por implementar)
- [ ] Task list renders
- [ ] Filter by status
- [ ] Sort by priority
- [ ] Create new task
- [ ] Edit task
- [ ] Delete task
- [ ] Drag & drop in Kanban
- [ ] Task detail modal
- [ ] Add comment

### ⏳ Calendario (por implementar)
- [ ] Month view renders
- [ ] Week view renders
- [ ] Day view renders
- [ ] Create event
- [ ] Drag event to new date
- [ ] Resize event
- [ ] Recurring task display

### ⏳ Dashboard (por implementar)
- [ ] KPI cards render
- [ ] Chart renders with data
- [ ] Activity feed updates
- [ ] Alert widget shows

## Firebase Emulator Testing

### Setup

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, doc, getDocs, collection } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeEach(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'gestordetrabajo',
    firestore: {
      rules: readFileSync('firestore.rules', 'utf8'),
      indexes: readFileSync('firestore.indexes.json', 'utf8'),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.cleanup();
});
```

### Seed Data for Tests

```typescript
async function seedTasks(testEnv: RulesTestEnvironment) {
  const db = testEnv.authenticatedContext('admin-uid').firestore();
  
  await setDoc(doc(db, 'tasks', 'task-1'), {
    title: 'Test Task 1',
    status: 'todo',
    priority: 'high',
    assigneeIds: ['user-1'],
    // ... other fields
  });
}
```
