'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, Copy, Check, UserPlus } from 'lucide-react';
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
import { useCreateUser } from '@/hooks/mutations/use-create-user';
import type { UserRole } from '@/types/domain/user';

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Admin', description: 'Gestión completa del negocio' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Viewer', description: 'Solo lectura' },
];

const SUPERADMIN_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'superadmin', label: 'Superadmin', description: 'Acceso total al sistema' },
  ...ROLES,
];

function generatePassword(): string {
  const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%';
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

interface Props {
  open: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  businessId?: string;
}

type Step = 'form' | 'success';

export function CreateUserModal({ open, onClose, isSuperAdmin = false, businessId }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('miembro');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const { mutate, isPending } = useCreateUser();

  const roles = isSuperAdmin ? SUPERADMIN_ROLES : ROLES;

  function handleGenerate() {
    setPassword(generatePassword());
  }

  async function handleCopyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) return;
    setError('');

    mutate(
      { name: name.trim(), email: email.trim(), password, role, businessId },
      {
        onSuccess: () => setStep('success'),
        onError: (err) => setError(err.message),
      }
    );
  }

  function handleClose() {
    setStep('form');
    setName('');
    setEmail('');
    setPassword(generatePassword());
    setRole('miembro');
    setError('');
    setCopied(false);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear usuario
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre completo</label>
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
                <label className="text-sm font-medium">Contraseña inicial</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pr-10 font-mono text-sm"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleGenerate}
                    title="Generar contraseña"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  El usuario podrá cambiarla luego desde su perfil.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rol</label>
                <div className="grid grid-cols-2 gap-2">
                  {roles.map((r) => (
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

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? 'Creando...' : 'Crear usuario'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Usuario creado
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                El usuario <span className="font-medium text-foreground">{name}</span> fue creado
                correctamente. Compartile estas credenciales:
              </p>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Contraseña</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium">{password}</span>
                    <button
                      type="button"
                      onClick={handleCopyPassword}
                      className="text-muted-foreground hover:text-foreground"
                      title="Copiar contraseña"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Guardá esta contraseña ahora — no se podrá ver de nuevo.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>Listo</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
