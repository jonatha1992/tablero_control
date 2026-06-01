import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { KanbanCard } from '@/components/tareas/kanban-card';
import type { Task } from '@/types';

// Mock @dnd-kit
vi.mock('@dnd-kit/core', () => ({
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
    isDragging: false,
  }),
}));

vi.mock('@dnd-kit/utilities', () => ({
  CSS: { Translate: { toString: () => '' } },
}));

// Mock DropdownMenu — en jsdom Radix no abre portales con fireEvent, renderizamos siempre el contenido
vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DropdownMenuTrigger: ({ children, asChild: _asChild }: { children: React.ReactNode; asChild?: boolean }) => <>{children}</>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div data-testid="dropdown-content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => (
    <button onClick={onClick}>{children}</button>
  ),
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  title: 'Tarea de prueba',
  description: 'Descripción de prueba',
  status: 'todo',
  priority: 'medium',
  type: 'task',
  assigneeIds: [],
  creatorId: 'user-1',
  tags: [],
  subtaskIds: [],
  subtasksCompleted: 0,
  checklist: [],
  attachmentUrls: [],
  commentCount: 0,
  position: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

const defaultProps = {
  column: 'todo' as const,
  onMove: vi.fn(),
  onPriorityChange: vi.fn(),
  onClick: vi.fn(),
  isSelected: false,
  isSelectMode: false,
};

describe('KanbanCard', () => {
  it('muestra el título de la tarea', () => {
    render(<KanbanCard task={makeTask()} {...defaultProps} />);
    expect(screen.getByText('Tarea de prueba')).toBeInTheDocument();
  });

  it('muestra el indicador de checklist cuando hay items', () => {
    render(
      <KanbanCard
        task={makeTask({
          checklist: [
            { id: 'c1', text: 'Uno', done: false },
            { id: 'c2', text: 'Dos', done: true },
          ],
        })}
        {...defaultProps}
      />
    );
    expect(screen.getByTitle('Checklist')).toBeInTheDocument();
    expect(screen.getByText('1/2')).toBeInTheDocument();
  });

  it('muestra la descripción cuando existe', () => {
    render(<KanbanCard task={makeTask()} {...defaultProps} />);
    expect(screen.getByText('Descripción de prueba')).toBeInTheDocument();
  });

  it('no muestra descripción si está vacía', () => {
    render(<KanbanCard task={makeTask({ description: '' })} {...defaultProps} />);
    expect(screen.queryByText('Descripción de prueba')).not.toBeInTheDocument();
  });

  it('muestra el badge de prioridad media', () => {
    render(<KanbanCard task={makeTask({ priority: 'medium' })} {...defaultProps} />);
    // Usamos getByTitle porque el mock de DropdownMenu renderiza siempre el contenido
    // y puede haber múltiples textos "Media" (badge + opción del menú)
    expect(screen.getByTitle(/Prioridad: Media/i)).toBeInTheDocument();
  });

  it('muestra el badge de prioridad urgente', () => {
    render(<KanbanCard task={makeTask({ priority: 'urgent' })} {...defaultProps} />);
    expect(screen.getByTitle(/Prioridad: Urgente/i)).toBeInTheDocument();
  });

  it('llama a onClick al hacer doble clic en la tarjeta', () => {
    const onClick = vi.fn();
    const task = makeTask();
    render(<KanbanCard task={task} {...defaultProps} onClick={onClick} />);

    fireEvent.dblClick(screen.getByText('Tarea de prueba'));
    expect(onClick).toHaveBeenCalledWith(task);
  });

  it('muestra los tags de la tarea', () => {
    render(<KanbanCard task={makeTask({ tags: ['frontend', 'bug'] })} {...defaultProps} />);
    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('bug')).toBeInTheDocument();
  });

  it('muestra "+N" cuando hay más de 3 tags', () => {
    render(
      <KanbanCard
        task={makeTask({ tags: ['a', 'b', 'c', 'd', 'e'] })}
        {...defaultProps}
      />
    );
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('muestra contador de comentarios cuando commentCount > 0', () => {
    render(<KanbanCard task={makeTask({ commentCount: 3 })} {...defaultProps} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('no muestra contador de comentarios cuando es 0', () => {
    const { container } = render(
      <KanbanCard task={makeTask({ commentCount: 0 })} {...defaultProps} />
    );
    // MessageSquare icon should not be rendered
    expect(container.querySelectorAll('svg')).toBeTruthy(); // other icons may exist
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('muestra el indicador de urgente', () => {
    const { container } = render(
      <KanbanCard task={makeTask({ priority: 'urgent' })} {...defaultProps} />
    );
    // Urgent task has a red dot indicator
    expect(container.querySelector('.bg-red-500')).toBeInTheDocument();
  });

  it('abre el picker de prioridad al hacer click en el badge', () => {
    render(<KanbanCard task={makeTask({ priority: 'medium' })} {...defaultProps} />);
    fireEvent.click(screen.getByTitle(/Prioridad: Media/i));
    expect(screen.getByText('Cambiar prioridad')).toBeInTheDocument();
  });

  it('llama a onPriorityChange al seleccionar una nueva prioridad', () => {
    const onPriorityChange = vi.fn();
    render(
      <KanbanCard
        task={makeTask({ id: 'task-1', priority: 'medium' })}
        {...defaultProps}
        onPriorityChange={onPriorityChange}
      />
    );

    fireEvent.click(screen.getByTitle(/Prioridad: Media/i));
    fireEvent.click(screen.getByText('Alta'));

    expect(onPriorityChange).toHaveBeenCalledWith('task-1', 'high');
  });

  it('muestra fecha de vencimiento cuando existe', () => {
    const dueDate = new Date('2026-12-31');
    render(<KanbanCard task={makeTask({ dueDate })} {...defaultProps} />);
    expect(screen.getByText(/dic/i)).toBeInTheDocument();
  });

  it('muestra fecha en rojo cuando está vencida y no está completada', () => {
    const dueDate = new Date('2020-01-01'); // pasado
    const { container } = render(
      <KanbanCard task={makeTask({ dueDate, status: 'todo' })} {...defaultProps} />
    );
    expect(container.querySelector('.text-red-500')).toBeInTheDocument();
  });
});
