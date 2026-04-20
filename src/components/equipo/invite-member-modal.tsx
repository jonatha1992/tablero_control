'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';
import type { InviteMemberDTO } from '@/types/dto/team.dto';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Gestión completa del negocio' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Viewer', description: 'Solo lectura' },
];

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (dto: InviteMemberDTO) => void;
}

export function InviteMemberModal({ open, onClose, onInvite }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('miembro');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !name.trim()) return;
    onInvite({ email: email.trim(), name: name.trim(), role });
    setEmail('');
    setName('');
    setRole('miembro');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
          <DialogDescription>
            Envía una invitación por correo electrónico para unirse a tu equipo.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Juan García"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="juan@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Rol</label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRole(r.value)}
                  className={cn(
                    'rounded-md border p-2.5 text-left text-xs transition-colors',
                    role === r.value
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-muted-foreground/50'
                  )}
                >
                  <p className="font-medium">{r.label}</p>
                  <p className="mt-0.5 text-muted-foreground">{r.description}</p>
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Invitar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
