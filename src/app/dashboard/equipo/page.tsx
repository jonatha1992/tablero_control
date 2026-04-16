'use client';

import { Users, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MemberCard } from '@/components/equipo/member-card';
import { InviteMemberModal } from '@/components/equipo/invite-member-modal';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useInviteMember } from '@/hooks/mutations/use-invite-member';
import { useRemoveMember } from '@/hooks/mutations/use-update-member';
import { useTeamUIStore } from '@/stores/team-ui.store';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';
import type { InviteMemberDTO } from '@/types/dto/team.dto';

const ROLE_TABS: { value: UserRole | 'all'; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'admin', label: 'Admin' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'miembro', label: 'Miembro' },
  { value: 'viewer', label: 'Viewer' },
];

export default function EquipoPage() {
  const { searchQuery, roleFilter, isInviteModalOpen, setSearchQuery, setRoleFilter, openInviteModal, closeInviteModal } =
    useTeamUIStore();

  const { data: members = [], isLoading } = useMembersQuery();
  const inviteMember = useInviteMember();
  const removeMember = useRemoveMember();

  const filtered = members.filter((m) => {
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q);
    return matchesRole && matchesSearch;
  });

  const activeCount = members.filter((m) => m.isActive).length;

  function handleInvite(dto: InviteMemberDTO) {
    inviteMember.mutate(dto);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold">Equipo</h1>
          <p className="text-muted-foreground text-xs mt-0.5">
            {members.length} miembros · {activeCount} activos
          </p>
        </div>
        <Button size="sm" onClick={openInviteModal}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invitar
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nombre o email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
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
              onRemove={(id) => removeMember.mutate(id)}
              canManage
            />
          ))}
        </div>
      )}

      <InviteMemberModal
        open={isInviteModalOpen}
        onClose={closeInviteModal}
        onInvite={handleInvite}
      />
    </div>
  );
}
