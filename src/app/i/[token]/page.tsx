import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { InviteClient } from './invite-client';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const invite = await prisma.businessInvite.findUnique({
    where: { id: token },
    include: { business: { select: { name: true } } },
  });

  if (!invite || !invite.isActive) {
    return <InvalidInvite reason="revoked" />;
  }
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return <InvalidInvite reason="expired" />;
  }
  if (invite.maxUses > 0 && invite.usedCount >= invite.maxUses) {
    return <InvalidInvite reason="max_uses" />;
  }

  const usesLeft = invite.maxUses > 0 ? invite.maxUses - invite.usedCount : null;

  return (
    <InviteClient
      token={token}
      businessName={invite.business.name}
      expiresAt={invite.expiresAt?.toISOString()}
      usesLeft={usesLeft}
    />
  );
}

function InvalidInvite({ reason }: { reason: 'expired' | 'max_uses' | 'revoked' | 'not_found' }) {
  const messages: Record<string, string> = {
    expired: 'Este link de invitación expiró.',
    max_uses: 'Este link ya alcanzó el límite de usos.',
    revoked: 'Este link de invitación fue cancelado.',
    not_found: 'Este link no es válido.',
  };
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-destructive mb-2">Link inválido</h1>
        <p className="text-muted-foreground">{messages[reason] ?? messages.not_found}</p>
        <p className="mt-4 text-sm text-muted-foreground">
          Pedile a tu administrador que genere uno nuevo.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-primary hover:underline"
        >
          Ir al inicio de sesión
        </Link>
      </div>
    </div>
  );
}
