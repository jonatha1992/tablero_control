import { Task } from '@/types';
import type { BusinessSettings } from '@/types/domain/business';
import { isAttachmentRequiredToFinalize } from '@/lib/business-defaults';
import { toast } from 'sonner';

/**
 * Validates if a task can be transitioned to "done".
 * Returns true if valid, false if invalid (and shows a toast).
 */
export function validateTaskCompletion(task: Task, settings?: BusinessSettings | null): boolean {
  // B1 / B4: Checklist completeness
  if (task.checklist && task.checklist.length > 0) {
    const pending = task.checklist.filter((item) => !item.done).length;
    if (pending > 0) {
      toast.warning(
        `Checklist incompleto: ${pending} ${pending === 1 ? 'ítem pendiente' : 'ítems pendientes'}`,
        { description: 'Completá todos los ítems antes de finalizar la tarea.' }
      );
      return false;
    }
  }

  // B2: Attachment required
  if (isAttachmentRequiredToFinalize(settings)) {
    if (!task.attachments || task.attachments.length === 0) {
      toast.warning('Adjunto requerido', {
        description: 'Este negocio requiere subir al menos un comprobante/adjunto para poder finalizar la tarea.',
      });
      return false;
    }
  }

  return true;
}
