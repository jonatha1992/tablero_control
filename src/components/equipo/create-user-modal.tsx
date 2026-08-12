'use client';

import { useState } from 'react';
import { Copy, Check, UserPlus, AlertTriangle, Loader2, X, Mail } from 'lucide-react';
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
import { useCreateUser } from '@/hooks/mutations/use-create-user';
import { useInviteUser } from '@/hooks/mutations/use-invite-user';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';
import type { UserRole } from '@/types/domain/user';
import { SectorAssignmentsField, type SectorAssignmentRow, type SectorScope } from '@/components/equipo/sector-assignments-field';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'responsable', label: 'Responsable' },
  { value: 'miembro', label: 'Miembro' },
  { value: 'viewer', label: 'Visualizador' },
];

const SUPERADMIN_ROLES: { value: UserRole; label: string }[] = [
  { value: 'superadmin', label: 'Superadmin' },
  ...ROLES,
];

interface Props {
  open: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
  businessId?: string;
}

type Step = 'form' | 'success';
type DeliveryMethod = 'email' | 'link';

export function CreateUserModal({ open, onClose, isSuperAdmin = false, businessId }: Props) {
  const [step, setStep] = useState<Step>('form');
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('email');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('miembro');
  const [locationAssignments, setLocationAssignments] = useState<SectorAssignmentRow[]>([]);
  const [scope, setScope] = useState<SectorScope>('all');
  const [advancedPerms, setAdvancedPerms] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [limitInfo, setLimitInfo] = useState<{ limit: number; current: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const inviteUser = useInviteUser();
  const createUser = useCreateUser();
  const { data: locations = [] } = useLocationsQuery();

  const roles = isSuperAdmin ? SUPERADMIN_ROLES : ROLES;
  const isPending = inviteUser.isPending || createUser.isPending;
  const useInviteFlow = Boolean(businessId) && !isSuperAdmin;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!useInviteFlow && !trimmedName) nextErrors.name = 'El nombre es obligatorio';
    const requireEmail = !useInviteFlow || deliveryMethod === 'email';
    if (requireEmail) {
      if (!trimmedEmail) nextErrors.email = 'El correo electrónico es obligatorio';
      else if (!EMAIL_REGEX.test(trimmedEmail)) nextErrors.email = 'El correo no es válido';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setError('');
    setLimitInfo(null);

    if (useInviteFlow && businessId) {
      const locationIds =
        locationAssignments.length > 0
          ? [...new Set(locationAssignments.map((a) => a.locationId))]
          : undefined;

      inviteUser.mutate(
        {
          businessId,
          role,
          locationIds,
          maxUses: 1,
          expiresInDays: 7,
          ...(deliveryMethod === 'email' && trimmedEmail ? { email: trimmedEmail } : {}),
        },
        {
          onSuccess: (data) => {
            setInviteLink(data.link);
            setEmailSent(data.emailSent ?? false);
            setStep('success');
          },
          onError: (err) => {
            if (err.message === 'members_limit_exceeded') {
              const e = err as Error & { limit?: number; current?: number };
              setLimitInfo({ limit: e.limit ?? 0, current: e.current ?? 0 });
            } else {
              setError(err.message);
            }
          },
        }
      );
      return;
    }

    createUser.mutate(
      {
        name: trimmedName,
        email: trimmedEmail,
        mode: 'email',
        role,
        businessId,
        locationAssignments:
          locationAssignments.length > 0
            ? locationAssignments.map(({ locationId: locId, role: r }) => ({
                locationId: locId,
                role: r,
              }))
            : undefined,
      },
      {
        onSuccess: () => {
          setInviteLink('');
          setEmailSent(true);
          setStep('success');
        },
        onError: (err) => {
          if (err.message === 'members_limit_exceeded') {
            const e = err as Error & { limit?: number; current?: number };
            setLimitInfo({ limit: e.limit ?? 0, current: e.current ?? 0 });
          } else {
            setError(err.message);
          }
        },
      }
    );
  }

  async function handleCopyLink() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    if (isPending) return;
    setStep('form');
    setDeliveryMethod('email');
    setName('');
    setEmail('');
    setRole('miembro');
    setLocationAssignments([]);
    setScope('all');
    setAdvancedPerms(false);
    setInviteLink('');
    setEmailSent(false);
    setError('');
    setLimitInfo(null);
    setCopied(false);
    setErrors({});
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onInteractOutside={(e) => { if (isPending) e.preventDefault(); }}>
        {step === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Invitar usuario
              </DialogTitle>
              <DialogDescription>
                {useInviteFlow
                  ? deliveryMethod === 'email'
                    ? 'Enviaremos un correo personal con el link de invitación (un solo uso).'
                    : 'Generá un link de un solo uso para compartirlo vos por el canal que prefieras.'
                  : 'Se enviará un correo para que el usuario active su acceso.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {useInviteFlow && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Cómo invitar</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('email')}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        deliveryMethod === 'email'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-input hover:bg-muted/50'
                      }`}
                    >
                      <span className="font-medium block">Por correo</span>
                      <span className="text-xs text-muted-foreground">Más privado · un solo uso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('link')}
                      className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                        deliveryMethod === 'link'
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-input hover:bg-muted/50'
                      }`}
                    >
                      <span className="font-medium block">Solo link</span>
                      <span className="text-xs text-muted-foreground">Copiás o compartís vos</span>
                    </button>
                  </div>
                  {role === 'admin' && deliveryMethod === 'link' && (
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Para administradores recomendamos invitar por correo personal, así el link no queda expuesto.
                    </p>
                  )}
                </div>
              )}

              {!useInviteFlow && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Nombre completo</label>
                  <Input
                    placeholder="Juan García"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>
              )}

              {(!useInviteFlow || deliveryMethod === 'email') && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Correo electrónico</label>
                  <Input
                    type="email"
                    placeholder="juan@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={150}
                    required
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rol en el espacio</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>

              <SectorAssignmentsField
                assignments={locationAssignments}
                onChange={setLocationAssignments}
                locations={locations}
                baseRole={role}
                scope={scope}
                onScopeChange={setScope}
                advancedPerms={advancedPerms}
                onAdvancedPermsChange={setAdvancedPerms}
              />

              {limitInfo && (
                <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <p className="text-sm font-medium">Límite de usuarios alcanzado</p>
                  </div>
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    Tu plan permite hasta <strong>{limitInfo.limit}</strong> usuarios y ya tenés{' '}
                    <strong>{limitInfo.current}</strong> activos.
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
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
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
                    <Mail className="mr-1.5 h-4 w-4" />
                  )}
                  {isPending
                    ? 'Enviando...'
                    : useInviteFlow && deliveryMethod === 'link'
                      ? 'Generar link'
                      : 'Enviar invitación'}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <Check className="h-5 w-5" />
                {emailSent ? 'Invitación enviada' : 'Link generado'}
              </DialogTitle>
              <DialogDescription>
                {useInviteFlow
                  ? 'La persona definirá su nombre al crear la cuenta.'
                  : `${name.trim()} recibirá las instrucciones para activar su acceso.`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {emailSent && (
                <p className="text-sm text-muted-foreground">
                  Enviamos un correo a <span className="font-medium text-foreground">{email}</span> con
                  las instrucciones para ingresar.
                </p>
              )}
              {inviteLink && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    También podés compartir este link directamente:
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={inviteLink} readOnly className="font-mono text-xs" />
                    <Button type="button" variant="outline" size="icon" onClick={handleCopyLink} title="Copiar link">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
              {!inviteLink && emailSent && (
                <p className="text-xs text-muted-foreground">
                  El usuario definirá su contraseña desde el correo de invitación.
                </p>
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
