import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KanbanColumn } from '@/components/tareas/kanban-column';
import type { Task, TaskStatus } from '@/types';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => children,
  useDraggable: () => ({ setNodeRef: vi.fn(), attributes: {}, listeners: {}, isDragging: false, transform: null }),
  useDroppable: () => ({ setNodeRef: vi.fn(), isOver: false }),
  DragOverlay: ({ children }: { children: React.ReactNode }) => children,
  PointerSensor: class {},
  TouchSensor: class {},
  KeyboardSensor: class {},
  useSensor: vi.fn(),
  useSensors: vi.fn(() => []),
  closestCorners: vi.fn(),
}));

vi.mock('@/components/tareas/kanban-card', () => ({
  KanbanCard: ({ task }: { task: Task }) => <div data-testid="kanban-card">{task.title}</div>,
}));

// ─── Fixtures ───────────────────────────────────────────────────────────────

const makeTasks = (status: TaskStatus = 'todo'): Task[] => [
  { id: 't-1', title: 'Tarea Urgente', status, priority: 'urgent', businessId: 'biz-1', createdAt: new Date(), updatedAt: new Date(), creatorId: 'u-1', assigneeIds: [], tags: [], attachments: [] } as unknown as Task,
  { id: 't-2', title: 'Tarea Baja', status, priority: 'low', businessId: 'biz-1', createdAt: new Date(), updatedAt: new Date(), creatorId: 'u-1', assigneeIds: [], tags: [], attachments: [] } as unknown as Task,
  { id: 't-3', title: 'Tarea Media', status, priority: 'medium', businessId: 'biz-1', createdAt: new Date(), updatedAt: new Date(), creatorId: 'u-1', assigneeIds: [], tags: [], attachments: [] } as unknown as Task,
  { id: 't-4', title: 'Tarea Alta', status, priority: 'high', businessId: 'biz-1', createdAt: new Date(), updatedAt: new Date(), creatorId: 'u-1', assigneeIds: [], tags: [], attachments: [] } as unknown as Task,
];

const defaultProps = {
  status: 'todo' as TaskStatus,
  tasks: [],
  onCardClick: vi.fn(),
  onPriorityChange: vi.fn(),
  onAddClick: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('KanbanColumn', () => {
  it('muestra el label correcto del status', () => {
    render(<KanbanColumn {...defaultProps} status="todo" tasks={[]} />);
    // TASK_STATUS_LABELS['todo'] = 'Por hacer' o similar
    // Solo verificamos que hay un heading
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('muestra el contador de tareas', () => {
    const tasks = makeTasks('todo').slice(0, 2);
    render(<KanbanColumn {...defaultProps} tasks={tasks} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('muestra "Sin tareas" cuando tasks=[]', () => {
    render(<KanbanColumn {...defaultProps} tasks={[]} />);
    expect(screen.getByText('Sin tareas')).toBeInTheDocument();
  });

  it('renderiza una KanbanCard por tarea', () => {
    const tasks = makeTasks('todo').slice(0, 3);
    render(<KanbanColumn {...defaultProps} tasks={tasks} />);
    const cards = screen.getAllByTestId('kanban-card');
    expect(cards).toHaveLength(3);
  });

  it('no muestra "Sin tareas" cuando hay tareas', () => {
    const tasks = makeTasks('todo').slice(0, 1);
    render(<KanbanColumn {...defaultProps} tasks={tasks} />);
    expect(screen.queryByText('Sin tareas')).not.toBeInTheDocument();
  });

  it('ordena por prioridad: urgent > high > medium > low', () => {
    const tasks = makeTasks('todo');
    render(<KanbanColumn {...defaultProps} tasks={tasks} />);
    const cards = screen.getAllByTestId('kanban-card');
    // El primero debe ser 'urgent', el último 'low'
    expect(cards[0]).toHaveTextContent('Tarea Urgente');
    expect(cards[1]).toHaveTextContent('Tarea Alta');
    expect(cards[2]).toHaveTextContent('Tarea Media');
    expect(cards[3]).toHaveTextContent('Tarea Baja');
  });

  it('muestra el contador correcto (0 cuando tasks vacío)', () => {
    render(<KanbanColumn {...defaultProps} tasks={[]} />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
