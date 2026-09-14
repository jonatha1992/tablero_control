import { ApiError } from '@/lib/api/errors';
import { toast } from 'sonner';

export function showLeaveBusinessError(err: Error): void {
  if (err instanceof ApiError && err.code) {
    switch (err.code) {
      case 'no_business':
        toast.error('No tenés un espacio activo');
        return;
      case 'not_member':
        toast.error('Ya no formás parte de este espacio');
        return;
      case 'cannot_leave_owner':
        toast.error('No podés salir del espacio siendo su propietario');
        return;
      case 'last_admin_cannot_leave':
        toast.error('Sos el único administrador', {
          description: 'Asigná otro admin antes de salir del espacio.',
        });
        return;
    }
  }

  toast.error('Error al salir del espacio', { description: err.message || undefined });
}
