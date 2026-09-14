'use client';

import { useState } from 'react';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useAuth } from '@/hooks/auth-context';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLeaveBusiness } from '@/hooks/mutations/use-leave-business';

/**
 * Self-service "leave business" — placed in the Equipo header (reachable by
 * admin/responsable via sidebar) and in Config > Mi Perfil (reachable by every
 * role, since miembro/viewer don't see the Equipo nav item — see
 * src/components/layout/sidebar.tsx isItemVisible '/dashboard/equipo').
 */
export function LeaveBusinessButton() {
  const [open, setOpen] = useState(false);
  const { user, isOwner, isAdmin } = useAuth();
  const { data: members = [] } = useMembersQuery();
  const leaveBusiness = useLeaveBusiness();

  if (!user || isOwner) return null;

  // Only checks 'admin' because useMembersQuery goes through findByBusiness
  // (src/repositories/prisma/user.repository.ts ~113-121), which normalizes
  // membership role 'superadmin' to 'admin' for the client. The server route
  // counts admin|superadmin via findActiveAdminOrSuperadminsByBusiness.
  const hasOtherAdmin = members.some(
    (m) => m.id !== user.id && m.role === 'admin' && m.isActive !== false
  );
  const blockedAsLastAdmin = isAdmin && !hasOtherAdmin;

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive hover:text-destructive disabled:opacity-40"
        onClick={() => setOpen(true)}
        disabled={blockedAsLastAdmin}
        title={
          blockedAsLastAdmin
            ? 'Sos el único administrador. Asigná otro admin antes de salir.'
            : undefined
        }
      >
        <LogOut className="mr-1.5 h-4 w-4" />
        Salir del espacio
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Salir del espacio"
        description="¿Querés salir de este espacio? Vas a perder acceso a sus tareas y proyectos."
        confirmLabel="Salir"
        variant="destructive"
        loading={leaveBusiness.isPending}
        onConfirm={() => leaveBusiness.mutate()}
      />
    </>
  );
}
