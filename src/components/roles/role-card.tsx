'use client';

import { useState } from 'react';
import type { CustomRole } from '@/types/domain/custom-role';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { Users, Pencil, Trash2, Lock } from 'lucide-react';
import { useToggleRole, useDeleteRole } from '@/hooks/mutations/use-save-role';

interface Props {
  role: CustomRole;
  onEdit: (role: CustomRole) => void;
}

export function RoleCard({ role, onEdit }: Props) {
  const toggle = useToggleRole();
  const remove = useDeleteRole();
  const [blockedOpen, setBlockedOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function handleDelete() {
    if (role.userCount > 0) {
      setBlockedOpen(true);
      return;
    }
    setDeleteOpen(true);
  }

  return (
    <>
    <div className={cn('border bg-card rounded-xl p-4 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all', !role.isActive && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full shrink-0 flex items-center justify-center" style={{ backgroundColor: role.color }}>
            <span className="text-white text-xs font-bold">{role.name.slice(0, 2).toUpperCase()}</span>
          </div>
          <div>
            <p className="font-medium text-sm leading-tight">{role.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{role.baseRole}</p>
          </div>
        </div>
        {role.isSystem && <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />}
      </div>

      {role.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
      )}

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" />
        <span>{role.userCount} usuario{role.userCount !== 1 ? 's' : ''}</span>
        <span className="mx-1">·</span>
        <span className="capitalize">{role.scope.type}</span>
      </div>

      <div className="flex items-center justify-between pt-1 border-t">
        <label className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
          <input
            type="checkbox"
            checked={role.isActive}
            disabled={role.isSystem || toggle.isPending}
            onChange={() => toggle.mutate({ roleId: role.id, isActive: !role.isActive })}
            className="rounded"
          />
          Activo
        </label>

        {!role.isSystem && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onEdit(role)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title="Editar"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={remove.isPending}
              className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
    <ConfirmDialog
      open={blockedOpen}
      onOpenChange={setBlockedOpen}
      title="No se puede eliminar este rol"
      description={`${role.userCount} usuario${role.userCount !== 1 ? 's' : ''} tienen este rol. Reasignalos primero.`}
      confirmLabel="Entendido"
      hideCancel
      onConfirm={() => setBlockedOpen(false)}
    />
    <ConfirmDialog
      open={deleteOpen}
      onOpenChange={setDeleteOpen}
      title="Eliminar rol"
      description={`El rol "${role.name}" se eliminará de forma permanente.`}
      confirmLabel="Eliminar"
      variant="destructive"
      loading={remove.isPending}
      onConfirm={() => remove.mutate(role.id, { onSuccess: () => setDeleteOpen(false) })}
    />
    </>
  );
}
