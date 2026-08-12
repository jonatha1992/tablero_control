'use client';

import { useState } from 'react';
import { Copy, Check, Link2, Loader2, Mail, Share2, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCreateInvite } from '@/hooks/mutations/use-create-invite';
import { useLocationsQuery } from '@/hooks/queries/use-locations-query';

interface Props {
  open: boolean;
  onClose: () => void;
  businessId?: string;
}

type DeliveryMethod = 'link' | 'email';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CreateInviteModal({ open, onClose, businessId }: Props) {
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('link');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [selectedLocationIds, setSelectedLocationIds] = useState<string[]>([]);
  const [role, setRole] = useState<string>('miembro');
  const [maxUses, setMaxUses] = useState('0');
  const [expiresInDays, setExpiresInDays] = useState('7');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const { mutate, isPending, data } = useCreateInvite();
  const { data: locations = [] } = useLocationsQuery();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    setError('');

    const trimmedEmail = inviteeEmail.trim().toLowerCase();
    if (deliveryMethod === 'email') {
      if (!trimmedEmail) {
        setError('El correo es obligatorio para enviar la invitación');
        return;
      }
      if (!EMAIL_REGEX.test(trimmedEmail)) {
        setError('El correo no es válido');
        return;
      }
    }

    const parsedMaxUses = parseInt(maxUses, 10) || 0;
    if (deliveryMethod === 'link' && parsedMaxUses < 0) {
      setError('El límite de usos no puede ser negativo');
      return;
    }

    mutate(
      {
        businessId,
        role,
        locationIds: selectedLocationIds.length > 0 ? selectedLocationIds : undefined,
        maxUses: deliveryMethod === 'email' ? 1 : parsedMaxUses,
        expiresInDays: parseInt(expiresInDays, 10) || 0,
        ...(deliveryMethod === 'email' ? { email: trimmedEmail } : {}),
      },
      {
        onError: (err) => setError((err as Error).message || 'No se pudo generar el link'),
      }
    );
  }

  const inviteLink = data?.link ?? (data ? `${window.location.origin}/i/${data.id}` : '');
  const emailSent = data?.emailSent ?? false;

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    if (isPending) return;
    setDeliveryMethod('link');
    setInviteeEmail('');
    setSelectedLocationIds([]);
    setRole('miembro');
    setMaxUses('0');
    setExpiresInDays('7');
    setCopied(false);
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {data ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {emailSent ? <Mail className="h-5 w-5" /> : <Link2 className="h-5 w-5" />}
                {emailSent ? 'Invitación enviada' : 'Link generado'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {emailSent && inviteeEmail && (
                <p className="text-sm text-muted-foreground">
                  Enviamos un correo a <span className="font-medium text-foreground">{inviteeEmail}</span> con
                  el link de invitación (un solo uso).
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                {emailSent
                  ? 'También podés copiar el link si necesitás reenviarlo manualmente.'
                  : 'Compartí este link con quienes querés que se unan al equipo.'}{' '}
                Al ingresar, recibirán el rol <strong>{data.role}</strong>.
              </p>
              <div className="flex items-center gap-2">
                <Input value={inviteLink} readOnly className="font-mono text-sm" />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} title="Copiar">
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 gap-2"
                  onClick={() => {
                    const text = `¡Hola! Te invito a unirte a nuestro equipo en Tablero de Control.\n\n${inviteLink}`;
                    if (navigator.share) {
                      navigator.share({ title: 'Invitación a Tablero de Control', text });
                    } else {
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }
                  }}
                >
                  <Share2 className="h-4 w-4" />
                  Compartir
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-10 gap-2"
                  onClick={() => {
                    const text = `¡Hola! Te invito a unirte a nuestro equipo en Tablero de Control.\n\n${inviteLink}`;
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                  }}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  WhatsApp
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {data.maxUses > 0 ? `Máx ${data.maxUses} usos` : 'Usos ilimitados'} ·{' '}
                {data.expiresAt
                  ? `Expira ${new Date(data.expiresAt).toLocaleDateString('es-AR')}`
                  : 'Sin expiración'}
              </p>
            </div>
            <DialogFooter>
              <Button onClick={handleClose}>
                <Check className="mr-1.5 h-4 w-4" />
                Listo
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Link2 className="h-5 w-5" />
                Invitar al equipo
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Cómo invitar</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('link')}
                    className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                      deliveryMethod === 'link'
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                        : 'border-input hover:bg-muted/50'
                    }`}
                  >
                    <span className="font-medium block">Link compartible</span>
                    <span className="text-xs text-muted-foreground">WhatsApp, QR, etc.</span>
                  </button>
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
                    <span className="text-xs text-muted-foreground">Un solo uso · más privado</span>
                  </button>
                </div>
                {role === 'admin' && deliveryMethod === 'link' && (
                  <p className="text-xs text-amber-700 dark:text-amber-400">
                    Para administradores recomendamos invitar por correo personal.
                  </p>
                )}
              </div>

              {deliveryMethod === 'email' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Correo del invitado</label>
                  <Input
                    type="email"
                    placeholder="juan@empresa.com"
                    value={inviteeEmail}
                    onChange={(e) => setInviteeEmail(e.target.value)}
                    maxLength={150}
                    required
                  />
                </div>
              )}

              <p className="text-sm text-muted-foreground">
                {deliveryMethod === 'email'
                  ? 'Se enviará un correo con un link de un solo uso.'
                  : 'Quien ingrese por el link recibirá el rol que elijas. Podés cambiarlo después desde el equipo.'}
              </p>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Rol</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="miembro">Miembro</option>
                  <option value="responsable">Responsable</option>
                  <option value="viewer">Solo lectura</option>
                  <option value="admin">Admin</option>
                  <option value="pending">Pendiente (aprobación manual)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Sectores (opcional)</label>
                {locations.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No hay sectores creados</p>
                ) : (
                  <div className="max-h-36 overflow-y-auto rounded-md border border-input bg-background p-2 space-y-1">
                    {locations.map((loc) => (
                      <label key={loc.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-muted/50 cursor-pointer text-sm">
                        <input
                          type="checkbox"
                          checked={selectedLocationIds.includes(loc.id)}
                          onChange={(e) => {
                            setSelectedLocationIds((prev) =>
                              e.target.checked
                                ? [...prev, loc.id]
                                : prev.filter((id) => id !== loc.id)
                            );
                          }}
                          className="rounded border-input"
                        />
                        {loc.name}
                      </label>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {selectedLocationIds.length > 0
                    ? `${selectedLocationIds.length} sector(es) seleccionado(s)`
                    : 'El invitado podrá ser asignado después'}
                </p>
              </div>

              <div className={`grid gap-3 ${deliveryMethod === 'link' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {deliveryMethod === 'link' && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium">Límite de usos</label>
                    <Input
                      type="number"
                      min={0}
                      value={maxUses}
                      onChange={(e) => setMaxUses(e.target.value)}
                      placeholder="0 = ilimitado"
                      maxLength={10}
                    />
                    <p className="text-xs text-muted-foreground">0 = ilimitado</p>
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Expira en (días)</label>
                  <Input
                    type="number"
                    min={0}
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(e.target.value)}
                    placeholder="0 = nunca"
                  />
                  <p className="text-xs text-muted-foreground">0 = nunca</p>
                </div>
              </div>

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
                    <Link2 className="mr-1.5 h-4 w-4" />
                  )}
                  {isPending
                    ? 'Procesando...'
                    : deliveryMethod === 'email'
                      ? 'Enviar invitación'
                      : 'Generar link'}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
