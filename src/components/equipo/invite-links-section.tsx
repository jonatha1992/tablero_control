'use client';

import { useState } from 'react';
import { Link2, Copy, Check, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInvitesQuery } from '@/hooks/queries/use-invites-query';
import { useRevokeInvite } from '@/hooks/mutations/use-revoke-invite';
import type { UserRole } from '@/types/domain/user';

const ROLE_LABELS: Record<UserRole, string> = {
  superadmin: 'Superadmin',
  admin: 'Administrador',
  responsable: 'Responsable',
  miembro: 'Miembro',
  viewer: 'Visualizador',
  pending: 'Pendiente',
};

interface Props {
  businessId?: string;
}

export function InviteLinksSection({ businessId }: Props) {
  const { data: invites = [], isLoading } = useInvitesQuery(businessId);
  const revoke = useRevokeInvite(businessId);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleCopy(link: string, id: string) {
    await navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          Links de invitación
        </h3>
      </div>

      {invites.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No tenés links de invitación activos. Generá uno para compartir con tu equipo.
        </p>
      ) : (
        <div className="space-y-2">
          {invites.map((invite) => {
            const link = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/i/${invite.id}`;
            const usesLeft = invite.maxUses > 0 ? invite.maxUses - invite.usedCount : null;
            const isExpired = invite.expiresAt ? new Date(invite.expiresAt) < new Date() : false;

            return (
              <div
                key={invite.id}
                className="flex items-center justify-between rounded-lg border bg-muted/30 p-3 gap-3"
              >
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium truncate">{invite.id.slice(0, 12)}...</span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                      {ROLE_LABELS[invite.role as UserRole]}
                    </span>
                    {isExpired && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Expirado
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-3">
                    {usesLeft !== null && <span>{invite.usedCount}/{invite.maxUses} usos</span>}
                    {invite.expiresAt && !isExpired && (
                      <span>Expira {new Date(invite.expiresAt).toLocaleDateString('es-AR')}</span>
                    )}
                    {usesLeft === null && !invite.expiresAt && <span>Sin límite</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleCopy(link, invite.id)}
                    title="Copiar link"
                  >
                    {copiedId === invite.id ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => revoke.mutate(invite.id)}
                    disabled={revoke.isPending}
                    title="Revocar"
                  >
                    {revoke.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
