'use client';

import { useState, useEffect, useRef } from 'react';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { useRolesQuery } from '@/hooks/queries/use-roles-query';
import { RoleCard } from '@/components/roles/role-card';
import { RoleEditorDrawer } from '@/components/roles/role-editor-drawer';
import type { CustomRole } from '@/types/domain/custom-role';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';

const SYSTEM_ROLES_DEFAULT = [
  { id: 'role-admin',       name: 'Admin',       slug: 'admin',       baseRole: 'responsable' as const, color: '#6366f1' },
  { id: 'role-responsable', name: 'Responsable', slug: 'responsable', baseRole: 'responsable' as const, color: '#8b5cf6' },
  { id: 'role-miembro',     name: 'Miembro',     slug: 'miembro',     baseRole: 'miembro'     as const, color: '#22c55e' },
  { id: 'role-viewer',      name: 'Viewer',      slug: 'viewer',      baseRole: 'viewer'      as const, color: '#64748b' },
];

export default function EquipoRolesPage() {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useRolesQuery(user?.businessId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const qc = useQueryClient();
  const initDone = useRef(false);

  useEffect(() => {
    if (isLoading || initDone.current || !user?.businessId) return;
    const hasSystem = roles.some((r) => r.isSystem);
    if (hasSystem) return;
    initDone.current = true;
    const colRef = collection(db, 'businesses', user.businessId, 'roles');
    Promise.all(
      SYSTEM_ROLES_DEFAULT.map((r) =>
        setDoc(doc(colRef, r.id), {
          ...r,
          businessId: user.businessId,
          description: '',
          scope: { type: 'business' },
          permissions: {},
          isActive: true,
          isSystem: true,
          userCount: 0,
          createdBy: 'system',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      )
    ).then(() => {
      qc.invalidateQueries({ queryKey: ['roles', user.businessId] });
    }).catch((err) => {
      console.error('[roles] init system roles failed:', err);
      initDone.current = false;
    });
  }, [isLoading, roles, user?.businessId, qc]);

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
    <div className="max-w-4xl space-y-8 h-full overflow-auto">
      {/* Actions header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Diseñá roles personalizados para tu equipo. Los roles del sistema no se pueden editar.
        </p>
        {isAdmin && customRoles.length > 0 && (
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
          <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
            Roles del sistema
          </h2>
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
