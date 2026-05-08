'use client';

import { useState } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { ROLE_LABELS, ROLE_COLORS } from '@/lib/constants/user';
import { getInitials } from '@/lib/utils/string';
import { EditMemberModal } from './edit-member-modal';
import { Edit2, Mail, UserX, MapPin } from 'lucide-react';
import type { User } from '@/types';

interface Location {
  id: string;
  name: string;
}

interface MemberTableProps {
  members: User[];
  locations: Location[];
  onRemove?: (id: string) => void;
  canManage?: boolean;
  isSelectMode?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  allSelected?: boolean;
  onToggleSelectAll?: () => void;
}

function MemberRow({
  member,
  locations,
  onRemove,
  canManage,
  isSelectMode,
  isSelected,
  onToggleSelect,
}: {
  member: User;
  locations: Location[];
  onRemove?: (id: string) => void;
  canManage?: boolean;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Prefer multi-sector assignments; fall back to legacy single locationId
  const sectorChips: { id: string; name: string; role?: string }[] =
    member.locationAssignments?.length
      ? member.locationAssignments.map((a) => ({
          id: a.locationId,
          name: a.locationName ?? locations.find((l) => l.id === a.locationId)?.name ?? a.locationId,
          role: a.role !== member.role ? a.role : undefined,
        }))
      : member.locationId
        ? [{ id: member.locationId, name: locations.find((l) => l.id === member.locationId)?.name ?? member.locationId }]
        : [];

  return (
    <>
      <tr
        className={cn(
          'group/row border-b transition-colors hover:bg-muted/40',
          isSelectMode && 'cursor-pointer select-none',
          isSelected && 'bg-primary/5 hover:bg-primary/5'
        )}
        onClick={isSelectMode ? () => onToggleSelect?.(member.id) : undefined}
      >
        {isSelectMode && (
          <td className="w-10 px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect?.(member.id)}
            />
          </td>
        )}

        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <Avatar className="h-8 w-8">
                {member.avatar && <AvatarImage src={member.avatar} alt={member.name} />}
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(member.name)}
                </AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background',
                  member.isActive ? 'bg-green-500' : 'bg-gray-300'
                )}
              />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{member.name}</p>
              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
        </td>

        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={cn(
              'inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium',
              ROLE_COLORS[member.role]
            )}
          >
            {ROLE_LABELS[member.role]}
          </span>
        </td>

        <td className="px-4 py-3">
          {sectorChips.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {sectorChips.map((s) => (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary/80"
                  title={s.role ? `Rol en sector: ${s.role}` : undefined}
                >
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  {s.name}
                  {s.role && (
                    <span className="opacity-60">· {s.role}</span>
                  )}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </td>

        <td className="px-4 py-3 whitespace-nowrap">
          <span
            className={cn(
              'text-xs font-medium',
              member.isActive ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground'
            )}
          >
            {member.isActive ? 'Activo' : 'Inactivo'}
          </span>
        </td>

        {canManage && !isSelectMode && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-0.5 opacity-0 group-hover/row:opacity-100 transition-opacity">
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
          </td>
        )}
      </tr>

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
        onRemove={onRemove}
      />
    </>
  );
}

export function MemberTable({
  members,
  locations,
  onRemove,
  canManage,
  isSelectMode,
  selectedIds = [],
  onToggleSelect,
  allSelected,
  onToggleSelectAll,
}: MemberTableProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-card border-b">
            <tr>
              {isSelectMode && (
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Seleccionar todos"
                  />
                </th>
              )}
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Usuario
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Rol
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Sector
              </th>
              <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Estado
              </th>
              {canManage && !isSelectMode && (
                <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Acciones
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                locations={locations}
                onRemove={onRemove}
                canManage={canManage}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.includes(member.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
