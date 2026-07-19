import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { KanbanBoard } from '@/components/tareas/kanban-board';
import { toast } from 'sonner';
import type { BusinessSettings } from '@/types/domain/business';
import type { Task } from '@/types/domain/task';

let capturedOnDragEnd: ((event: unknown) => void) | undefined;

const moveTaskMutate = vi.fn();
const bulkMoveMutate = vi.fn();
const updateTaskMutate = vi.fn();
const bulkDeleteMutate = vi.fn();
const bulkAssignLocationMutate = vi.fn();
const clearSelection = vi.fn();
const clearDrag = vi.fn();
const setDraggedTask = vi.fn();

let businessSettings: BusinessSettings | null = null;
let storeState: ReturnType<typeof createStoreState>;

vi.mock('sonner', () => ({
  toast: {
    warning: vi.fn(),
  },
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children, onDragEnd }: { children: ReactNode; onDragEnd?: (event: unknown) => void }) => {
    capturedOnDragEnd = onDragEnd;
    return <div>{children}</div>;
  },
  DragOverlay: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PointerSensor: class {},
  KeyboardSensor: class {},
  closestCorners: vi.fn(),
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
}));

vi.mock('@dnd-kit/sortable', () => ({
  sortableKeyboardCoordinates: vi.fn(),
}));

vi.mock('@/components/tareas/kanban-column', () => ({
  KanbanColumn: ({ status }: { status: string }) => <div data-testid={`column-${status}`} />,
}));

vi.mock('@/components/tareas/kanban-card', () => ({
  KanbanCard: ({ task }: { task: Task }) => <div>{task.title}</div>,
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: ReactNode }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: ReactNode; onClick?: () => void }) => (
    <button onClick={onClick} type="button">
      {children}
    </button>
  ),
  DropdownMenuCheckboxItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogHeader: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogFooter: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogTitle: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  DialogDescription: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/tareas/task-detail-modal', () => ({
  TaskDetailModal: () => null,
}));

vi.mock('@/components/tareas/create-task-modal', () => ({
  CreateTaskModal: () => null,
}));

vi.mock('@/components/tareas/dictate-tasks-modal', () => ({
  DictateTasksModal: () => null,
}));

vi.mock('@/components/tareas/incomplete-checklist-dialog', () => ({
  IncompleteChecklistDialog: () => null,
}));

vi.mock('@/hooks/mutations/use-move-task', () => ({
  useMoveTask: () => ({ mutate: moveTaskMutate, isPending: false }),
}));

vi.mock('@/hooks/mutations/use-update-task', () => ({
  useUpdateTask: () => ({ mutate: updateTaskMutate, isPending: false }),
}));

vi.mock('@/hooks/mutations/use-bulk-move-tasks', () => ({
  useBulkMoveTasks: () => ({ mutate: bulkMoveMutate, isPending: false }),
}));

vi.mock('@/hooks/mutations/use-bulk-delete-tasks', () => ({
  useBulkDeleteTasks: () => ({ mutate: bulkDeleteMutate, isPending: false }),
}));

vi.mock('@/hooks/mutations/use-bulk-assign-task-location', () => ({
  useBulkAssignTaskLocation: () => ({ mutate: bulkAssignLocationMutate, isPending: false }),
}));

vi.mock('@/hooks/queries/use-locations-query', () => ({
  useLocationsQuery: () => ({ data: [] }),
}));

vi.mock('@/hooks/queries/use-objectives-query', () => ({
  useObjectivesQuery: () => ({ data: [] }),
}));

vi.mock('@/hooks/queries/use-business-query', () => ({
  useBusinessQuery: () => ({ data: { settings: businessSettings } }),
}));

vi.mock('@/stores/kanban-ui.store', () => ({
  useKanbanUIStore: () => storeState,
}));

vi.mock('@/hooks/auth-context', () => ({
  useAuth: () => ({ user: { businessId: 'business-1', role: 'admin' } }),
}));

vi.mock('@/hooks/use-can-delete-task', () => ({
  useCanDeleteTask: () => ({ canDeleteAny: false, canDeleteTask: vi.fn(() => true) }),
}));

vi.mock('@/components/sectores/sector-modal', () => ({
  SECTOR_ICONS: [],
}));

function createStoreState(selectedTaskIds: string[] = ['task-1', 'task-2']) {
  return {
    dragState: { draggedTaskId: null, draggedFrom: null, dragOverColumn: null },
    filters: { searchQuery: '', priority: '', locationId: '', objectiveId: '', cycleId: '' },
    isCreateModalOpen: false,
    isDetailModalOpen: false,
    isDictateModalOpen: false,
    selectedTaskId: null,
    setDraggedTask,
    clearDrag,
    setFilters: vi.fn(),
    openCreateModal: vi.fn(),
    closeCreateModal: vi.fn(),
    openDictateModal: vi.fn(),
    closeDictateModal: vi.fn(),
    openTaskDetail: vi.fn(),
    closeTaskDetail: vi.fn(),
    isSelectMode: true,
    toggleSelectMode: vi.fn(),
    selectedTaskIds,
    toggleTaskSelection: vi.fn(),
    selectAllInColumn: vi.fn(),
    clearSelection,
    activeColumns: ['todo', 'done'],
    toggleColumn: vi.fn(),
    columnSortModes: {
      backlog: 'priority',
      todo: 'priority',
      in_progress: 'priority',
      in_review: 'priority',
      done: 'priority',
      blocked: 'priority',
      archived: 'priority',
    },
    setColumnSortMode: vi.fn(),
  };
}

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Tarea',
    description: '',
    status: 'todo',
    priority: 'medium',
    type: 'task',
    assigneeIds: [],
    assignees: [],
    creatorId: 'user-1',
    businessId: 'business-1',
    projectId: 'project-1',
    locationId: undefined,
    cycleId: undefined,
    objectiveId: undefined,
    parentId: undefined,
    tags: [],
    startDate: undefined,
    dueDate: undefined,
    completedDate: undefined,
    estimatedHours: undefined,
    actualHours: undefined,
    recurrence: undefined,
    recurrenceSpawnedAt: undefined,
    recurrenceGroupId: undefined,
    checklist: [],
    deletedAt: undefined,
    deletedBy: undefined,
    subtaskIds: [],
    subtasksCompleted: 0,
    attachmentUrls: [],
    attachments: [],
    commentCount: 0,
    position: 0,
    createdAt: new Date('2026-07-19T12:00:00Z'),
    updatedAt: new Date('2026-07-19T12:00:00Z'),
    ...overrides,
  };
}

describe('KanbanBoard bulk done validation', () => {
  beforeEach(() => {
    capturedOnDragEnd = undefined;
    businessSettings = null;
    storeState = createStoreState();
    vi.clearAllMocks();
  });

  it('blocks toolbar bulk move to done when any selected checklist is incomplete', () => {
    render(
      <KanbanBoard
        tasks={[
          buildTask({
            id: 'task-1',
            title: 'Lista',
            checklist: [{ id: 'c-1', text: 'Completo', done: true }],
          }),
          buildTask({
            id: 'task-2',
            title: 'Pendiente',
            checklist: [{ id: 'c-2', text: 'Falta', done: false }],
          }),
        ]}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Finalizado' }));

    expect(bulkMoveMutate).not.toHaveBeenCalled();
    expect(moveTaskMutate).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      'Checklist incompleto en selección',
      expect.objectContaining({
        description: expect.stringContaining('1 de 2 tareas seleccionadas'),
      }),
    );
  });

  it('blocks multi-select drag to done when another selected task needs attachment', () => {
    businessSettings = { requireAttachmentToFinalize: true };

    render(
      <KanbanBoard
        tasks={[
          buildTask({
            id: 'task-1',
            title: 'Arrastrada',
            attachments: [{ url: 'https://example.com/a.pdf', name: 'Adjunto' }],
          }),
          buildTask({
            id: 'task-2',
            title: 'Bloqueada',
            attachments: [],
          }),
        ]}
      />,
    );

    act(() => {
      capturedOnDragEnd?.({
        active: { id: 'task-1' },
        over: { id: 'done' },
      });
    });

    expect(clearDrag).toHaveBeenCalled();
    expect(bulkMoveMutate).not.toHaveBeenCalled();
    expect(moveTaskMutate).not.toHaveBeenCalled();
    expect(toast.warning).toHaveBeenCalledWith(
      'Adjunto requerido en selección',
      expect.objectContaining({
        description: expect.stringContaining('1 de 2 tareas seleccionadas'),
      }),
    );
  });
});
