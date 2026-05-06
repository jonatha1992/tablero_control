'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types/domain/user';
import type { InviteMemberDTO } from '@/types/dto/team.dto';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Gestión completa del negocio' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Visualizador', description: 'Solo lectura' },
];

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onInvite: (dto: InviteMemberDTO) => void;
  isPending?: boolean;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberModal({ open, onClose, onInvite, isPending }: InviteMemberModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('miembro');
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const next: Record<string, string> = {};
    if (!name.trim()) next.name = 'El nombre es requerido';
    else if (name.trim().length < 2) next.name = 'Mínimo 2 caracteres';
    if (!email.trim()) next.email = 'El correo electrónico es requerido';
    else if (!EMAIL_REGEX.test(email.trim())) next.email = 'Correo electrónico inválido';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onInvite({ email: email.trim(), name: name.trim(), role });
    setEmail('');
    setName('');
    setRole('miembro');
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar miembro</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre</label>
            <Input
              placeholder="Juan García"
              value={name}
              onChange={(e) => { setName(e.target.value); if (errors.name) setErrors((p) => ({ ...p, name: '' })); }}
              maxLength={100}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Correo electrónico</label>
            <Input
              type="email"
              placeholder="juan@empresa.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
              maxLength={150}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Invitando...' : 'Invitar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
