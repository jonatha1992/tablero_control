'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/user';
import { getInitials } from '@/lib/utils/string';
import { EditMemberModal } from './edit-member-modal';
import { Edit2, Mail, UserX, MapPin } from 'lucide-react';
import type { User, UserRole } from '@/types';

interface MemberCardProps {
  member: User;
  onRemove?: (id: string) => void;
  onChangeRole?: (id: string, role: UserRole) => void;
  canManage?: boolean;
}

export function MemberCard({ member, onRemove, canManage }: MemberCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <Card className="group relative">
        <CardContent className="p-4">
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
              </div>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              {member.locationId && (
                <p className="mt-1 flex items-center gap-1 text-[10px] text-primary/80 font-medium">
                  <MapPin className="h-2.5 w-2.5" />
                  Local asignado
                </p>
              )}
            </div>

            {canManage && (
              <div className="flex shrink-0 items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
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
                {onRemove && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setConfirmOpen(true)}
                    title="Eliminar miembro"
                  >
                    <UserX className="h-3.5 w-3.5" />
                  </Button>
                )}
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

      <EditMemberModal
        member={member}
        open={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
