'use client';

import { useState } from 'react';
import { useTimeEntriesQuery, useCreateTimeEntry, useDeleteTimeEntry } from '@/hooks/queries/use-time-entries-query';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function TaskTimeTracking({ taskId, estimatedHours, actualHours }: {
  taskId: string;
  estimatedHours?: number;
  actualHours?: number;
}) {
  const { data: entries = [] } = useTimeEntriesQuery(taskId);
  const createEntry = useCreateTimeEntry();
  const deleteEntry = useDeleteTimeEntry();
  const { user } = useAuth();
  const [hours, setHours] = useState('');
  const [note, setNote] = useState('');

  const totalLogged = actualHours ?? entries.reduce((sum, e) => sum + e.hours, 0);
  const progress = estimatedHours && estimatedHours > 0
    ? Math.min(100, Math.round((totalLogged / estimatedHours) * 100))
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const h = parseFloat(hours);
    if (!h || h <= 0 || h > 24) {
      return;
    }
    createEntry.mutate(
      { taskId, data: { hours: h, note: note.trim() || undefined } },
      { onSuccess: () => { setHours(''); setNote(''); } }
    );
  };

  const canDelete = (entryUserId: string) => {
    return user?.id === entryUserId || user?.role === 'admin' || user?.role === 'superadmin';
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium flex items-center gap-1.5">
          <Clock className="h-4 w-4" /> Registro de tiempos
        </h4>
        <span className="text-xs text-muted-foreground">
          {totalLogged.toFixed(1)}h {estimatedHours ? `/ ${estimatedHours}h` : 'registradas'}
        </span>
      </div>

      {estimatedHours !== undefined && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all',
              progress > 100 ? 'bg-red-500' : progress >= 80 ? 'bg-green-500' : 'bg-primary'
            )}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      )}

      <div className="space-y-2 max-h-40 overflow-auto">
        {entries.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin registros de tiempo</p>
        )}
        {entries.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2 text-sm">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px]">
                {entry.user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? '?'}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground w-16 truncate">{entry.user?.name?.split(' ')[0]}</span>
            <span className="font-medium w-12">{entry.hours}h</span>
            {entry.note && <span className="text-xs text-muted-foreground flex-1 truncate">{entry.note}</span>}
            <span className="text-[10px] text-muted-foreground">
              {new Date(entry.date).toLocaleDateString('es')}
            </span>
            {canDelete(entry.userId) && (
              <button
                onClick={() => deleteEntry.mutate({ id: entry.id, taskId })}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            type="number"
            min={0.1}
            step={0.1}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Horas"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex-[2]">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Nota (opcional)"
            maxLength={500}
            className="h-8 text-sm"
          />
        </div>
        <Button type="submit" size="sm" disabled={!hours || createEntry.isPending}>
          <Clock className="h-3 w-3 mr-1" />
          Registrar
        </Button>
      </form>
    </div>
  );
}
