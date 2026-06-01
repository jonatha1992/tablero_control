'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/user';
import { getInitials } from '@/lib/utils/string';
import { EditMemberModal } from './edit-member-modal';
import { MemberRemoveButton } from './member-remove-button';
import { Edit2, Mail, MapPin } from 'lucide-react';
import type { User, UserRole } from '@/types';

interface MemberCardProps {
  member: User;
  actorId?: string;
  onRemove?: (id: string) => void;
  onChangeRole?: (id: string, role: UserRole) => void;
  canManage?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function MemberCard({ member, actorId, onRemove, canManage, isSelectMode, isSelected, onToggleSelect }: MemberCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card
        className={cn(
          'group relative',
          isSelectMode && 'cursor-pointer select-none',
          isSelected && 'ring-2 ring-primary'
        )}
        onClick={isSelectMode ? () => onToggleSelect?.(member.id) : undefined}
      >
        {isSelectMode && (
          <div
            className="absolute left-2 top-2 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect?.(member.id)}
            />
          </div>
        )}
        <CardContent className={cn('p-4', isSelectMode && 'pl-8')}>
          <div className="flex items-start gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-10 w-10">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                  member.isActive ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <p className="truncate text-sm font-medium">{member.name}</p>
                <span
                  className={cn(
                    'inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
                    ROLE_COLORS[member.role]
                  )}
                >
                  {ROLE_LABELS[member.role]}
                </span>
                {member.isOwner && (
                  <span className="inline-flex shrink-0 items-center rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
                    Propietario
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              {member.locationId && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-primary/80 font-medium">
                  <MapPin className="h-2.5 w-2.5" />
                  Local asignado
                </p>
              )}
            </div>

            {canManage && !isSelectMode && (
              <div className="flex shrink-0 items-start gap-1 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setEditOpen(true)}
                  title="Editar miembro"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => window.open(`mailto:${member.email}`)}
                  title="Enviar email"
                >
                  <Mail className="h-3.5 w-3.5" />
                </Button>
                <MemberRemoveButton
                  member={member}
                  actorId={actorId}
                  onRemove={onRemove}
                  variant="icon"
                  onRequestConfirm={() => setConfirmOpen(true)}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación de eliminación */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        variant="destructive"
        title={`¿Eliminar a ${member.name}?`}
        description="El miembro perderá el acceso al equipo. Esta acción no se puede deshacer."
        confirmLabel="Sí, eliminar"
        onConfirm={() => {
          onRemove?.(member.id);
          setConfirmOpen(false);
        }}
      />

      {editOpen && (
        <EditMemberModal
          member={member}
          open={editOpen}
          onClose={() => setEditOpen(false)}
          actorId={actorId}
          onRemove={onRemove}
        />
      )}
    </>
  );
}
