'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, CheckSquare } from 'lucide-react';
import { useUpdateTask } from '@/hooks/mutations/use-update-task';
import type { Task, ChecklistItem } from '@/types';

interface TaskChecklistProps {
  task: Task;
}

export function TaskChecklist({ task }: TaskChecklistProps) {
  const [newItemText, setNewItemText] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const updateTask = useUpdateTask();

  const checklist = task.checklist ?? [];
  const completedCount = checklist.filter((i) => i.done).length;
  const progress = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;

  const handleToggle = (itemId: string) => {
    const next = checklist.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
    updateTask.mutate({ id: task.id, data: { checklist: next } });
  };

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    const next: ChecklistItem[] = [
      ...checklist,
      { id: `item-${Date.now()}`, text: newItemText.trim(), done: false },
    ];
    updateTask.mutate({ id: task.id, data: { checklist: next } });
    setNewItemText('');
    setIsAdding(false);
  };

  const handleDelete = (itemId: string) => {
    const next = checklist.filter((item) => item.id !== itemId);
    updateTask.mutate({ id: task.id, data: { checklist: next } });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Checklist</h3>
        {checklist.length > 0 && (
          <span className="text-xs text-muted-foreground">
            ({completedCount}/{checklist.length})
          </span>
        )}
      </div>

      {checklist.length > 0 && (
        <div className="space-y-1">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground text-right">{progress}% completado</p>
        </div>
      )}

      <div className="space-y-1.5">
        {checklist.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-2 group rounded-md hover:bg-muted/50 px-1.5 py-1"
          >
            <Checkbox
              checked={item.done}
              onChange={() => handleToggle(item.id)}
              className="h-4 w-4 shrink-0"
            />
            <span
              className={`text-sm flex-1 ${item.done ? 'line-through text-muted-foreground' : ''}`}
            >
              {item.text}
            </span>
            <button
              onClick={() => handleDelete(item.id)}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ))}
      </div>

      {isAdding ? (
        <div className="flex gap-2">
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') {
                setIsAdding(false);
                setNewItemText('');
              }
            }}
            placeholder="Nuevo ítem..."
            autoFocus
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button size="sm" className="h-8 px-2" onClick={handleAdd} disabled={!newItemText.trim()}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar ítem
        </button>
      )}
    </div>
  );
}
