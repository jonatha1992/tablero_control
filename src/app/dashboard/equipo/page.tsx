'use client';

import { Users, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MemberCard } from '@/components/equipo/member-card';
import { CreateUserModal } from '@/components/equipo/create-user-modal';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useRemoveMember } from '@/hooks/mutations/use-update-member';
import { useTeamUIStore } from '@/stores/team-ui.store';
import { useAuth } from '@/hooks/auth-context';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';

const ROLE_TABS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'miembro', label: 'Miembro' },
  { value: 'viewer', label: 'Viewer' },
];

export default function EquipoPage() {
  const { 
    searchQuery, roleFilter, locationFilter, isInviteModalOpen, 
    setSearchQuery, setRoleFilter, setLocationFilter, openInviteModal, closeInviteModal 
  } = useTeamUIStore();

  const { user, isAdmin } = useAuth();
  const { data: members = [], isLoading } = useMembersQuery();
  const { data: locations = [] } = useLocationsQuery();
  const removeMember = useRemoveMember();

  const filtered = members.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const matchesLocation = !locationFilter || m.locationId === locationFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchesRole && matchesLocation && matchesSearch;
  });

  const _activeCount = members.filter((m) => m.isActive).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-end gap-4">
        {isAdmin && (
          <Button size="sm" onClick={openInviteModal}>
            <UserPlus className="mr-1.5 h-4 w-4" />
            Invitar
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 sm:max-w-[200px]"
        >
          <option value="">Todos los locales</option>
          {locations.map((loc) => (
            <option key={loc.id} value={loc.id}>
              {loc.name}
            </option>
          ))}
        </select>
        <div className="flex gap-1 flex-wrap">
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

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg border bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-16 text-center text-muted-foreground">
          <Users className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">No se encontraron miembros</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onRemove={isAdmin ? (id) => removeMember.mutate(id) : undefined}
              canManage={isAdmin}
            />
          ))}
        </div>
      )}

      <CreateUserModal
        open={isInviteModalOpen}
        onClose={closeInviteModal}
        businessId={user?.businessId}
      />
    </div>
  );
}
