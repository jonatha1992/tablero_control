'use client';

import { useState } from 'react';
import { Eye, EyeOff, RefreshCw, Copy, Check, UserPlus, AlertTriangle, UserCheck, Loader2, X, Mail, User, Globe, UserRoundCog } from 'lucide-react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useCreateUser, EmailInactiveError } from '@/hooks/mutations/use-create-user';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import { useQueryClient } from '@tanstack/react-query';
import { memberKeys } from '@/hooks/queries/use-members-query';
import { getToken } from '@/lib/firebase/auth';
import type { UserRole } from '@/types/domain/user';
import type { CreateUserMode } from '@/app/api/users/create/route';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'admin', label: 'Administrador', description: 'Gestión completa de la empresa' },
  { value: 'responsable', label: 'Responsable', description: 'Gestión de locales/sectores' },
  { value: 'miembro', label: 'Miembro', description: 'Trabaja en tareas asignadas' },
  { value: 'viewer', label: 'Visualizador', description: 'Solo lectura' },
];

const SUPERADMIN_ROLES: { value: UserRole; label: string; description: string }[] = [
  { value: 'superadmin', label: 'Superadmin', description: 'Acceso total al sistema' },
  ...ROLES,
];

const MODES: { value: CreateUserMode; label: string; icon: React.ReactNode; hint: string }[] = [
  { value: 'email', label: 'Con correo', icon: <Mail className="h-4 w-4" />, hint: 'Email + contraseña. Se envía invitación.' },
  { value: 'username', label: 'Con usuario', icon: <User className="h-4 w-4" />, hint: 'Sin email. Ingresa con nombre de usuario.' },
  { value: 'google', label: 'Con Google', icon: <Globe className="h-4 w-4" />, hint: 'Ingresa su Gmail. El usuario usa Google para entrar.' },
  { value: 'ghost', label: 'Sin acceso', icon: <UserRoundCog className="h-4 w-4" />, hint: 'Solo para control interno y asignación de tareas.' },
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
  const [mode, setMode] = useState<CreateUserMode>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(() => generatePassword());
  const [createAccess, setCreateAccess] = useState(true);
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
    const trimmedUsername = username.trim();

    if (!trimmedName) nextErrors.name = 'El nombre es obligatorio';

    if (mode === 'email') {
      if (!trimmedEmail) nextErrors.email = 'El correo electrónico es obligatorio';
      else if (!EMAIL_REGEX.test(trimmedEmail)) nextErrors.email = 'El correo no es válido';
      if (createAccess && !password) nextErrors.password = 'La contraseña es obligatoria';
      else if (createAccess && password.length < 6) nextErrors.password = 'Mínimo 6 caracteres';
    }

    if (mode === 'username') {
      if (!trimmedUsername) nextErrors.username = 'El nombre de usuario es obligatorio';
      else if (!/^[a-z0-9_.-]{3,30}$/.test(trimmedUsername)) nextErrors.username = 'Solo letras minúsculas, números, _ . - (3-30 caracteres)';
      if (!password) nextErrors.password = 'La contraseña es obligatoria';
      else if (password.length < 6) nextErrors.password = 'Mínimo 6 caracteres';
    }

    if (mode === 'google') {
      if (!trimmedEmail) nextErrors.email = 'El Gmail es obligatorio';
      else if (!EMAIL_REGEX.test(trimmedEmail)) nextErrors.email = 'El Gmail no es válido';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError('');
    setLimitInfo(null);

    mutate(
      {
        name: trimmedName,
        email: mode !== 'username' && mode !== 'ghost' ? trimmedEmail : undefined,
        username: mode === 'username' ? trimmedUsername : undefined,
        password: mode === 'username' || (mode === 'email' && createAccess) ? password : undefined,
        mode,
        role,
        businessId,
        locationId: locationId || undefined,
      },
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
    setMode('email');
    setName('');
    setEmail('');
    setUsername('');
    setPassword(generatePassword());
    setCreateAccess(true);
    setRole('miembro');
    setLocationId('');
    setError('');
    setLimitInfo(null);
    setCopied(false);
    setInactiveUserId(null);
    setErrors({});
    onClose();
  }

  const successLabel = mode === 'username' ? username : email;
  const hasCredentials = mode === 'username' || (mode === 'email' && createAccess);

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
                Elegí cómo va a ingresar el nuevo usuario al sistema.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Mode selector */}
              <div className="grid grid-cols-2 gap-1.5 rounded-lg border p-1 sm:grid-cols-4">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => { setMode(m.value); setErrors({}); setError(''); }}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-md px-2 py-2 text-xs font-medium transition-colors',
                      mode === m.value
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted'
                    )}
                  >
                    {m.icon}
                    {m.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground -mt-1">
                {MODES.find((m) => m.value === mode)?.hint}
              </p>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Nombre completo</label>
                <Input
                  placeholder="Juan García"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              {/* Email (modes: email, google) */}
              {(mode === 'email' || mode === 'google') && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">
                    {mode === 'google' ? 'Gmail del usuario' : 'Correo electrónico'}
                  </label>
                  <Input
                    type="email"
                    placeholder={mode === 'google' ? 'usuario@gmail.com' : 'juan@empresa.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={150}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              )}

              {/* Username (mode: username) */}
              {mode === 'username' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nombre de usuario</label>
                  <Input
                    placeholder="juan.garcia"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                    maxLength={30}
                  />
                  {errors.username && <p className="text-xs text-destructive">{errors.username}</p>}
                  <p className="text-xs text-muted-foreground">Solo letras, números, puntos, guiones.</p>
                </div>
              )}

              {/* Password (modes: email, username) */}
              {mode === 'email' && (
                <label className="flex items-center gap-2 text-sm font-medium">
                  <Checkbox
                    checked={createAccess}
                    onChange={(e) => setCreateAccess(e.target.checked)}
                  />
                  Crear acceso con contraseña
                </label>
              )}

              {mode === 'username' || (mode === 'email' && createAccess) ? (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Contraseña inicial</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pr-10 font-mono text-sm"
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleGenerate} title="Generar contraseña">
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                  <p className="text-xs text-muted-foreground">El usuario podrá cambiarla luego.</p>
                </div>
              ) : null}

              {mode === 'google' && (
                <div className="rounded-md border border-blue-200 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                  El usuario deberá usar Continuar con Google para ingresar al sistema.
                </div>
              )}

              {mode === 'ghost' && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  Se crea sin credenciales. Queda disponible para asignarle sector y tareas.
                </div>
              )}

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Asignar Local/Sector (Opcional)</label>
                <select
                  value={locationId}
                  onChange={(e) => setLocationId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Sin asignar (Global)</option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                  ))}
                </select>
              </div>

              {/* Role */}
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
                  </p>
                  <Link href="/dashboard/billing" onClick={handleClose} className="inline-block text-sm font-medium text-amber-800 dark:text-amber-300 underline underline-offset-2">
                    Ver planes disponibles
                  </Link>
                </div>
              )}

              {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
              )}

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={handleClose} disabled={isPending}>
                  <X className="mr-1.5 h-4 w-4" />Cancelar
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserPlus className="mr-1.5 h-4 w-4" />}
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
                El correo <span className="font-medium text-foreground">{email}</span> ya existe pero está inactivo. ¿Querés reactivarlo?
              </p>
              {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleClose} disabled={reactivating}>
                <X className="mr-1.5 h-4 w-4" />Cancelar
              </Button>
              <Button onClick={handleReactivate} disabled={reactivating}>
                {reactivating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserCheck className="mr-1.5 h-4 w-4" />}
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
                El usuario <span className="font-medium text-foreground">{name}</span> fue creado correctamente.
                {hasCredentials && ' Compartile estas credenciales:'}
              </p>
              {hasCredentials ? (
                <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{mode === 'username' ? 'Usuario' : 'Correo'}</span>
                    <span className="font-medium">{successLabel}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Contraseña</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium">{password}</span>
                      <button type="button" onClick={handleCopyPassword} className="text-muted-foreground hover:text-foreground" title="Copiar contraseña">
                        {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              ) : mode === 'google' ? (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-muted-foreground">El usuario debe ingresar con <strong>Continuar con Google</strong> usando <span className="font-medium text-foreground">{email}</span>.</p>
                </div>
              ) : (
                <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                  <p className="text-muted-foreground">No se generaron credenciales. Podés asignarle tareas desde el tablero.</p>
                </div>
              )}
              {hasCredentials && (
                <p className="text-xs text-muted-foreground">Guardá esta contraseña ahora — no se podrá ver de nuevo.</p>
              )}
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
