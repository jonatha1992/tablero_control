import { ApiError } from '@/lib/api/errors';
import { toast } from 'sonner';

export function showRemoveMemberError(err: Error): void {
  if (err instanceof ApiError && err.code) {
    switch (err.code) {
      case 'cannot_remove_self':
        toast.error('No podés eliminarte a vos mismo');
        return;
      case 'cannot_remove_owner':
        toast.error('No se puede eliminar al propietario del espacio');
        return;
      case 'subscription_required':
        toast.error('Suscripción vencida', {
          description: err.message,
          action: {
            label: 'Ir a facturación',
            onClick: () => {
              window.location.href = '/dashboard/billing';
            },
          },
        });
        return;
      case 'Forbidden':
        toast.error('Sin permiso para eliminar miembros');
        return;
    }
  }

  const msg = err.message ?? '';
  if (msg.includes('cannot_remove_self')) {
    toast.error('No podés eliminarte a vos mismo');
    return;
  }
  if (msg.includes('cannot_remove_owner')) {
    toast.error('No se puede eliminar al propietario del espacio');
    return;
  }
  if (msg.includes('subscription_required')) {
    toast.error('Suscripción vencida', {
      description: msg,
      action: {
        label: 'Ir a facturación',
        onClick: () => {
          window.location.href = '/dashboard/billing';
        },
      },
    });
    return;
  }

  toast.error('Error al eliminar miembro', { description: msg || undefined });
}
