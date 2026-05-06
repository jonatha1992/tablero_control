'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, Copy, Check, UserPlus, AlertTriangle, UserCheck, Loader2, X } from 'lucide-react';
import Link from 'next/link';
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
import { useCreateUser, EmailInactiveError } from '@/hooks/mutations/use-create-user';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/hooks/queries/use-members-query';
import { getToken } from '@/lib/firebase/auth';
import type { UserRole } from '@/types/domain/user';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Gestión completa del negocio' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Visualizador', description: 'Solo lectura' },
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

type Step = 'form' | 'success' | 'reactivate';

export function CreateUserModal({ open, onClose, isSuperAdmin = false, businessId }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<UserRole>('miembro');
  const [locationId, setLocationId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [limitInfo, setLimitInfo] = useState<{ limit: number; current: number } | null>(null);
  const [inactiveUserId, setInactiveUserId] = useState<string | null>(null);
  const [reactivating, setReactivating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate, isPending } = useCreateUser();
  const { data: locations = [] } = useLocationsQuery();
  const queryClient = useQueryClient();

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
    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio';
    if (!trimmedEmail) nextErrors.email = 'El correo electrónico es obligatorio';
    else if (!EMAIL_REGEX.test(trimmedEmail)) nextErrors.email = 'El correo electrónico no es válido';
    if (!password) nextErrors.password = 'La contraseña es obligatoria';
    else if (password.length < 6) nextErrors.password = 'La contraseña debe tener al menos 6 caracteres';

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError('');
    setLimitInfo(null);

    mutate(
      { name: trimmedName, email: trimmedEmail, password, role, businessId, locationId: locationId || undefined },
      {
        onSuccess: () => setStep('success'),
        onError: (err) => {
          if (err instanceof EmailInactiveError) {
            setInactiveUserId(err.userId);
            setStep('reactivate');
          } else if (err.message === 'members_limit_exceeded') {
            const e = err as Error & { limit?: number; current?: number };
            setLimitInfo({ limit: e.limit ?? 0, current: e.current ?? 0 });
          } else {
            setError(err.message);
          }
        },
      }
    );
  }

  async function handleReactivate() {
    if (!inactiveUserId) return;
    setReactivating(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/members/${inactiveUserId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reactivate: true }),
      });
      if (!res.ok) throw new Error('No se pudo reactivar el usuario');
      await queryClient.refetchQueries({ queryKey: memberKeys.all });
      setStep('success');
    } catch (err) {
      setError((err as Error).message);
      setStep('form');
    } finally {
      setReactivating(false);
    }
  }

  function handleClose() {
    if (isPending || reactivating) return;
    setStep('form');
    setName('');
    setEmail('');
    setPassword(generatePassword());
    setRole('miembro');
    setLocationId('');
    setError('');
    setLimitInfo(null);
    setCopied(false);
    setInactiveUserId(null);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isPending || reactivating) e.preventDefault(); }}>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Crear usuario
              </DialogTitle>
              <DialogDescription>
                Ingresá los datos del nuevo usuario para darle acceso al sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input
                  placeholder="Juan García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={100}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Correo electrónico</label>
                <Input
                  type="email"
                  placeholder="juan@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  maxLength={150}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
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
                      minLength={6}
                    />
                    {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
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
                <label className="text-sm font-medium">Asignar Local/Sector (Opcional)</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin asignar (Global)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
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

              {limitInfo && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">Límite de usuarios alcanzado</p>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Tu plan permite hasta <strong>{limitInfo.limit}</strong> usuarios y ya tenés <strong>{limitInfo.current}</strong> activos.
                    Actualizá tu plan para agregar más.
                  </p>
                  <Link
                    href="/dashboard/billing"
                    onClick={handleClose}
                    className="inline-block text-sm font-medium text-amber-800 dark:text-amber-300 underline underline-offset-2"
                  >
                    Ver planes disponibles
                  </Link>
                </div>
              )}

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                  <X className="mr-1.5 h-4 w-4" />
                  Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="mr-1.5 h-4 w-4" />
                  )}
                  {isPending ? 'Creando...' : 'Crear usuario'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : step === 'reactivate' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <UserCheck className="h-5 w-5" />
                Usuario desactivado
              </DialogTitle>
              <DialogDescription>
                Este correo electrónico pertenece a un usuario que fue desactivado anteriormente.
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                El correo electrónico <span className="font-medium text-foreground">{email}</span> ya existe en el sistema pero está inactivo. ¿Querés reactivarlo?
              </p>
              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose} disabled={reactivating}>
                <X className="mr-1.5 h-4 w-4" />
                Cancelar
              </Button>
              <Button onClick={handleReactivate} disabled={reactivating}>
                {reactivating ? (
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                ) : (
                  <UserCheck className="mr-1.5 h-4 w-4" />
                )}
                {reactivating ? 'Reactivando...' : 'Reactivar usuario'}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                Usuario creado
              </DialogTitle>
              <DialogDescription>
                El usuario ha sido registrado exitosamente en el sistema.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <p className="text-sm text-muted-foreground">
                El usuario <span className="font-medium text-foreground">{name}</span> fue creado
                correctamente. Compartile estas credenciales:
              </p>
              <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Correo electrónico</span>
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
