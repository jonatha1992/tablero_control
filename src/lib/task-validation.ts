import type { ChecklistItem, Task } from '@/types';
import type { BusinessSettings } from '@/types/domain/business';
import { isAttachmentRequiredToFinalize } from '@/lib/business-defaults';
import { toast } from 'sonner';

export type CompletionCheck =
  | { ok: true }
  | { ok: false; reason: 'checklist_incomplete'; pending: ChecklistItem[]; doneItems: ChecklistItem[] }
  | { ok: false; reason: 'attachment_required' };

export type BulkCompletionCheck =
  | { ok: true }
  | { ok: false; reason: 'attachment_required' | 'checklist_incomplete'; blockedCount: number; totalCount: number };

export function checkTaskCompletion(task: Task, settings?: BusinessSettings | null): CompletionCheck {
  if (isAttachmentRequiredToFinalize(settings) && (!task.attachments || task.attachments.length === 0)) {
    return { ok: false, reason: 'attachment_required' };
  }

  const checklist = task.checklist ?? [];
  const pending = checklist.filter((item) => !item.done);

  if (pending.length > 0) {
    return {
      ok: false,
      reason: 'checklist_incomplete',
      pending,
      doneItems: checklist.filter((item) => item.done),
    };
  }

  return { ok: true };
}

export function checkBulkTaskCompletion(tasks: Task[], settings?: BusinessSettings | null): BulkCompletionCheck {
  let attachmentBlocked = 0;
  let checklistBlocked = 0;

  for (const task of tasks) {
    const result = checkTaskCompletion(task, settings);

    if (!result.ok) {
      if (result.reason === 'attachment_required') {
        attachmentBlocked += 1;
      } else {
        checklistBlocked += 1;
      }
    }
  }

  if (attachmentBlocked > 0) {
    return {
      ok: false,
      reason: 'attachment_required',
      blockedCount: attachmentBlocked,
      totalCount: tasks.length,
    };
  }

  if (checklistBlocked > 0) {
    return {
      ok: false,
      reason: 'checklist_incomplete',
      blockedCount: checklistBlocked,
      totalCount: tasks.length,
    };
  }

  return { ok: true };
}

/**
 * Validates if a task can be transitioned to "done".
 * Returns true if valid, false if invalid (and shows a toast).
 */
export function validateTaskCompletion(task: Task, settings?: BusinessSettings | null): boolean {
  const result = checkTaskCompletion(task, settings);

  if (!result.ok) {
    if (result.reason === 'checklist_incomplete') {
      const pending = result.pending.length;
      toast.warning(
        `Checklist incompleto: ${pending} ${pending === 1 ? 'ítem pendiente' : 'ítems pendientes'}`,
        { description: 'Confirmá igual desde el diálogo de finalización si querés cerrarla ahora.' }
      );
      return false;
    }

    toast.warning('Adjunto requerido', {
      description: 'Este negocio requiere subir al menos un comprobante/adjunto para poder finalizar la tarea.',
    });
    return false;
  }

  return true;
}
