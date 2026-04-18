'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useRolesQuery } from '@/hooks/queries/use-roles-query';
import { RoleCard } from '@/components/roles/role-card';
import { RoleEditorDrawer } from '@/components/roles/role-editor-drawer';
import type { CustomRole } from '@/types/domain/custom-role';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';

export default function RolesPage() {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useRolesQuery(user?.businessId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(role: CustomRole) {
    setEditing(role);
    setDrawerOpen(true);
  }

  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);

  return (
    <div className="p-6 max-w-4xl space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="h-6 w-6" /> Roles y permisos
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Diseñá roles personalizados para tu equipo. Los roles del sistema no se pueden editar.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" /> Nuevo rol
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" /> Cargando roles…
        </div>
      )}

      {!isLoading && systemRoles.length > 0 && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">Roles del sistema</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemRoles.map((r) => (
              <RoleCard key={r.id} role={r} onEdit={openEdit} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && (
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Roles personalizados{customRoles.length > 0 && ` (${customRoles.length})`}
          </h2>
          {customRoles.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl p-10 text-center">
              <ShieldCheck className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-medium">Todavía no creaste roles personalizados</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Cloná un rol base y ajustá los permisos exactos que necesita tu equipo.
              </p>
              {isAdmin && (
                <button
                  onClick={openCreate}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90"
                >
                  Crear primer rol
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {customRoles.map((r) => (
                <RoleCard key={r.id} role={r} onEdit={openEdit} />
              ))}
            </div>
          )}
        </section>
      )}

      <RoleEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />
    </div>
  );
}
