'use client';

import { useState } from 'react';
import { Users, UserPlus, Link2, CheckSquare, X, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { MemberTable } from '@/components/equipo/member-table';
import { CreateUserModal } from '@/components/equipo/create-user-modal';
import { CreateInviteModal } from '@/components/equipo/create-invite-modal';
import { InviteLinksSection } from '@/components/equipo/invite-links-section';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useRemoveMember } from '@/hooks/mutations/use-update-member';
import { useBulkAssignLocation } from '@/hooks/mutations/use-bulk-assign-location';
import { useTeamUIStore } from '@/stores/team-ui.store';
import { useAuth } from '@/hooks/auth-context';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';

const ROLE_TABS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Administrador' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'miembro', label: 'Miembro' },
  { value: 'viewer', label: 'Visualizador' },
];

export default function EquipoPage() {
  const {
    searchQuery, roleFilter, locationFilter, isInviteModalOpen, isCreateInviteModalOpen,
    setSearchQuery, setRoleFilter, setLocationFilter, openInviteModal, closeInviteModal,
    openCreateInviteModal, closeCreateInviteModal,
    isSelectMode, selectedIds, setSelectMode, toggleSelect, selectAll, clearSelection,
  } = useTeamUIStore();

  const [bulkLocationId, setBulkLocationId] = useState('');

  const { user, isAdmin, isOwner } = useAuth();
  const canManageTeam = isAdmin || isOwner;
  const { data: members = [], isLoading } = useMembersQuery();
  const { data: locations = [] } = useLocationsQuery();
  const removeMember = useRemoveMember();
  const bulkAssign = useBulkAssignLocation();

  const filtered = members.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesLocation =
      !locationFilter ||
      m.locationId === locationFilter ||
      m.locationAssignments?.some((assignment) => assignment.locationId === locationFilter);
    const q = searchQuery.toLowerCase();
    const name = (m.name ?? '').toLowerCase();
    const email = (m.email ?? '').toLowerCase();
    const matchesSearch = !q || name.includes(q) || email.includes(q);
    return matchesRole && matchesLocation && matchesSearch;
  });

  const allSelected = filtered.length > 0 && filtered.every((m) => selectedIds.includes(m.id));

  function handleToggleSelectAll() {
    if (allSelected) {
      clearSelection();
    } else {
      selectAll(filtered.map((m) => m.id));
    }
  }

  function handleExitSelectMode() {
    setSelectMode(false);
    setBulkLocationId('');
  }

  function handleBulkAssign() {
    if (selectedIds.length === 0 || !bulkLocationId) return;
    bulkAssign.mutate(
      { ids: selectedIds, locationId: bulkLocationId },
      { onSuccess: handleExitSelectMode }
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      {/* Top controls — fixed, no scroll */}
      <div className="flex-none space-y-3">
        <div className="flex items-start justify-end gap-4">
          {canManageTeam && !isSelectMode && (
            <>
              <Button size="sm" variant="outline" onClick={() => setSelectMode(true)}>
                <CheckSquare className="mr-1.5 h-4 w-4" />
                Seleccionar
              </Button>
              <Button size="sm" variant="outline" onClick={openCreateInviteModal}>
                <Link2 className="mr-1.5 h-4 w-4" />
                Link de invitación
              </Button>
              <Button size="sm" onClick={openInviteModal}>
                <UserPlus className="mr-1.5 h-4 w-4" />
                Invitar usuario
              </Button>
            </>
          )}
        </div>

        {isSelectMode && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 px-4 py-3">
            <Checkbox
              checked={allSelected}
              onChange={handleToggleSelectAll}
              aria-label="Seleccionar todos"
            />
            <span className="text-sm font-medium">
              {selectedIds.length} seleccionado{selectedIds.length !== 1 ? 's' : ''}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={bulkLocationId}
                  onChange={(e) => setBulkLocationId(e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Elige un sector...</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              <Button
                size="sm"
                disabled={selectedIds.length === 0 || !bulkLocationId || bulkAssign.isPending}
                onClick={handleBulkAssign}
              >
                {bulkAssign.isPending ? 'Asignando...' : 'Asignar sector'}
              </Button>

              <Button size="sm" variant="ghost" onClick={handleExitSelectMode}>
                <X className="mr-1 h-3.5 w-3.5" />
                Cancelar
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Buscar por nombre o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="sm:max-w-xs"
          />

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-[200px]"
          >
            <option value="">Todos los sectores</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1">
            {ROLE_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setRoleFilter(tab.value)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-colors',
                  roleFilter === tab.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Scrollable area — table + invite links */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4 pb-4">
        {isLoading ? (
          <div className="rounded-lg border overflow-hidden">
            <div className="border-b px-4 py-2.5 bg-card">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-2.5 w-48 rounded bg-muted animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
            <Users className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm">No se encontraron miembros</p>
          </div>
        ) : (
          <MemberTable
            members={filtered}
            locations={locations}
            actorId={user?.id}
            onRemove={canManageTeam && !isSelectMode ? (id) => removeMember.mutate(id) : undefined}
            canManage={canManageTeam}
            isSelectMode={isSelectMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            allSelected={allSelected}
            onToggleSelectAll={handleToggleSelectAll}
          />
        )}

        {canManageTeam && (
          <InviteLinksSection businessId={user?.businessId} />
        )}
      </div>

      <CreateUserModal
        open={isInviteModalOpen}
        onClose={closeInviteModal}
        businessId={user?.businessId}
      />

      <CreateInviteModal
        open={isCreateInviteModalOpen}
        onClose={closeCreateInviteModal}
        businessId={user?.businessId}
      />
    </div>
  );
}
