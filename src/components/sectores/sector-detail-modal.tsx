'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Edit2, Users, X } from 'lucide-react';
import { useMembersQuery } from '@/hooks/queries/use-members-query';
import { useRemoveMember } from '@/hooks/mutations/use-update-member';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/user';
import { getInitials } from '@/lib/utils/string';
import { cn } from '@/lib/utils';
import type { Location } from '@/types/domain/location';
import { SECTOR_ICONS } from './sector-modal';
import { MapPin } from 'lucide-react';

interface Props {
  sector: Location | null;
  open: boolean;
  onClose: () => void;
  onEdit: (sector: Location) => void;
}

export function SectorDetailModal({ sector, open, onClose, onEdit }: Props) {
  const { data: allMembers = [] } = useMembersQuery();
  const removeMember = useRemoveMember();
  const members = allMembers.filter((m) => m.locationId === sector?.id);

  if (!sector) return null;

  const iconName = sector.metadata?.icon as string | undefined;
  const iconEntry = SECTOR_ICONS.find((i) => i.name === iconName);
  const SectorIcon = iconEntry?.icon ?? MapPin;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SectorIcon className="h-4 w-4 text-primary" />
            {sector.name}
          </DialogTitle>
          <DialogDescription>
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider mr-2">
              {sector.type}
            </Badge>
            {sector.status === 'active' ? (
              <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                Activo
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                Inactivo
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {sector.description && (
          <p className="text-sm text-muted-foreground -mt-2">{sector.description}</p>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Miembros asignados ({members.length})
            </span>
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center rounded-lg border-2 border-dashed">
              Ningún miembro asignado a este local
            </p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <Avatar className="h-8 w-8 shrink-0">
                    {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                    <AvatarFallback className="text-xs font-semibold">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  </div>
                  <span className={cn(
                    'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    ROLE_COLORS[member.role]
                  )}>
                    {ROLE_LABELS[member.role]}
                  </span>
                  <button
                    onClick={() => removeMember.mutate(member.id)}
                    disabled={removeMember.isPending}
                    className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Quitar miembro del sector"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={() => { onClose(); onEdit(sector); }}>
            <Edit2 className="mr-1.5 h-3.5 w-3.5" />
            Editar local
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
