'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/auth-context';
import { useRolesQuery } from '@/hooks/queries/use-roles-query';
import { RoleCard } from '@/components/roles/role-card';
import { SystemRoleCard } from '@/components/roles/system-role-card';
import { RoleEditorDrawer } from '@/components/roles/role-editor-drawer';
import type { CustomRole } from '@/types/domain/custom-role';
import { Plus, Loader2, ShieldCheck } from 'lucide-react';
import { NAV_ICON_COLORS } from '@/lib/constants/ui-icon-colors';
import { cn } from '@/lib/utils';

const SYSTEM_ROLES = [
  {
    id: 'role-admin',
    name: 'Admin',
    slug: 'admin',
    color: '#6366f1',
    description: 'Acceso completo al negocio: usuarios, roles, facturación, reportes y todas las tareas.',
    permissions: ['Gestión de usuarios y roles', 'Configuración del negocio', 'Facturación y suscripción', 'Crear/editar/eliminar cualquier tarea', 'Gestión de sectores y equipos', 'Exportar reportes'],
  },
  {
    id: 'role-responsable',
    name: 'Responsable',
    slug: 'responsable',
    color: '#8b5cf6',
    description: 'Gestiona tareas y sectores asignados. Sin acceso a configuración del negocio.',
    permissions: ['Crear/editar/eliminar tareas', 'Asignar tareas', 'Comentar y adjuntar archivos', 'Ver reportes', 'Eliminar adjuntos'],
  },
  {
    id: 'role-miembro',
    name: 'Miembro',
    slug: 'miembro',
    color: '#22c55e',
    description: 'Trabaja en tareas asignadas. No puede crear ni eliminar.',
    permissions: ['Ver tareas', 'Actualizar tareas asignadas', 'Comentar', 'Subir archivos'],
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    slug: 'viewer',
    color: '#64748b',
    description: 'Solo lectura. No puede crear ni modificar nada.',
    permissions: ['Ver tareas', 'Ver reportes'],
  },
] as const;

export default function EquipoRolesPage() {
  const { user } = useAuth();
  const { data: roles = [], isLoading } = useRolesQuery(user?.businessId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  const customRoles = roles.filter((r) => !r.isSystem);

  function openCreate() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function openEdit(role: CustomRole) {
    setEditing(role);
    setDrawerOpen(true);
  }

  return (
    <div className="w-full space-y-8 h-full overflow-auto pb-8">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Diseñá roles personalizados para tu equipo. Los roles del sistema no se pueden editar.
        </p>
        {isAdmin && (
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 shrink-0"
          >
            <Plus className="h-4 w-4" /> {customRoles.length > 0 ? 'Nuevo rol' : 'Crear primer rol'}
          </button>
        )}
      </div>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Roles del sistema
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {SYSTEM_ROLES.map((r) => (
            <SystemRoleCard key={r.id} role={r} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Roles personalizados{customRoles.length > 0 && ` (${customRoles.length})`}
        </h2>

        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando roles…
          </div>
        )}

        {!isLoading && customRoles.length === 0 && (
          <div className="border-2 border-dashed rounded-xl p-10 text-center bg-card/30">
            <ShieldCheck className={cn('h-8 w-8 mx-auto mb-3', NAV_ICON_COLORS.equipo)} />
            <p className="font-medium">Todavía no creaste roles personalizados</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cloná un rol base y ajustá los permisos exactos que necesita tu equipo.
            </p>
          </div>
        )}

        {!isLoading && customRoles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customRoles.map((r) => (
              <RoleCard key={r.id} role={r} onEdit={openEdit} />
            ))}
          </div>
        )}
      </section>

      <RoleEditorDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initial={editing}
      />
    </div>
  );
}
