'use client';

import { useState, useEffect } from 'react';
import { UserCog, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useUpdateMember } from '@/hooks/mutations/use-update-member';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useRolesQuery } from '@/hooks/queries/use-roles-query';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/hooks/auth-context';
import type { User, UserRole } from '@/types/domain/user';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Gestión completa del negocio' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Viewer', description: 'Solo lectura' },
];

interface Props {
  member: User | null;
  open: boolean;
  onClose: () => void;
  onRemove?: (id: string) => void;
}

export function EditMemberModal({ member, open, onClose, onRemove }: Props) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('miembro');
  const [locationId, setLocationId] = useState<string>('');
  const [error, setError] = useState('');
  const [customRoleIds, setCustomRoleIds] = useState<string[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { user: authUser } = useAuth();
  const { mutate, isPending } = useUpdateMember();
  const { data: locations = [] } = useLocationsQuery();
  const { data: allRoles = [] } = useRolesQuery(authUser?.businessId);

  const availableCustomRoles = allRoles.filter((r) => r.isActive && !r.isSystem);

  useEffect(() => {
    if (member) {
      setName(member.name);
      setRole(member.role);
      setLocationId(member.locationId || '');
      setCustomRoleIds(member.customRoleIds ?? []);
    }
  }, [member, open]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!member) return;
    if (!name.trim() || !role) return;
    setError('');

    mutate(
      {
        id: member.id,
        data: {
          name: name.trim(),
          role,
          locationId: locationId || undefined,
          customRoleIds,
        }
      },
      {
        onSuccess: () => onClose(),
        onError: (err) => setError(err.message),
      }
    );
  }

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCog className="h-5 w-5" />
            Editar miembro
          </DialogTitle>
          <DialogDescription>
            Modificá los permisos y la ubicación del miembro del equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre completo</label>
            <Input
              placeholder="Juan García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              value={member?.email || ''}
              disabled
              className="bg-muted/50 opacity-70"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Asignar Local/Sector (Opcional)</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Sin asignar (Global)</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'rounded-md border p-2.5 text-left text-xs transition-colors',
                    role === r.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <p className="font-medium">{r.label}</p>
                  <p className="mt-0.5 text-muted-foreground line-clamp-1">{r.description}</p>
                </button>
              ))}
            </div>
          </div>

          {role !== 'superadmin' && availableCustomRoles.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Roles personalizados</label>
              <div className="space-y-1.5 rounded-md border border-input p-3">
                {availableCustomRoles.map((cr) => (
                  <label key={cr.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customRoleIds.includes(cr.id)}
                      onChange={(e) =>
                        setCustomRoleIds((prev) =>
                          e.target.checked ? [...prev, cr.id] : prev.filter((x) => x !== cr.id)
                        )
                      }
                      className="h-4 w-4 rounded border-input accent-primary"
                    />
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: cr.color }}
                    />
                    <span className="text-sm">{cr.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <DialogFooter className="sm:justify-between">
            {onRemove && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
                disabled={isPending}
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Eliminar miembro
              </Button>
            )}
            <div className="flex gap-2 sm:ml-auto">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {member && onRemove && (
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        variant="destructive"
        title={`¿Eliminar a ${member.name}?`}
        description="El miembro perderá el acceso al equipo. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={() => {
          onRemove(member.id);
          setConfirmDelete(false);
          onClose();
        }}
      />
    )}
    </>
  );
}
