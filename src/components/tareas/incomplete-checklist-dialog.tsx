'use client';

import type { ChecklistItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface IncompleteChecklistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: ChecklistItem[];
  doneItems: ChecklistItem[];
  onConfirm: () => void;
  isPending?: boolean;
}

export function IncompleteChecklistDialog({
  open,
  onOpenChange,
  pending,
  doneItems,
  onConfirm,
  isPending = false,
}: IncompleteChecklistDialogProps) {
  const pendingCount = pending.length;
  const doneCount = doneItems.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Checklist incompleto</DialogTitle>
          <DialogDescription>
            Esta tarea todavia tiene {pendingCount} {pendingCount === 1 ? 'item pendiente' : 'items pendientes'}.
            Podes marcarla como finalizada igual si ya no hace falta completar esos pasos.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {doneCount > 0 && (
            <p className="text-sm text-muted-foreground">
              {doneCount} {doneCount === 1 ? 'item ya completado' : 'items ya completados'}.
            </p>
          )}

          <div className="rounded-md border bg-muted/30 p-3">
            <p className="mb-2 text-sm font-medium">Pendientes</p>
            <ul className="space-y-2 text-sm">
              {pending.map((item) => (
                <li key={item.id} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                  <span>{item.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button type="button" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Finalizando...' : 'Finalizar igual'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
