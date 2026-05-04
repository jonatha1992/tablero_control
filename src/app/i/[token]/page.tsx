import { notFound } from 'next/navigation';
import { InviteClient } from './invite-client';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params;

  const res = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/invites/${token}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();

  if (!data.valid) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Link inválido</h1>
          <p className="text-muted-foreground">
            {data.reason === 'expired' && 'Este link de invitación expiró.'}
            {data.reason === 'max_uses' && 'Este link ya alcanzó el límite de usos.'}
            {data.reason === 'revoked' && 'Este link de invitación fue cancelado.'}
            {!['expired', 'max_uses', 'revoked'].includes(data.reason) && 'Este link no es válido.'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Pedile a tu administrador que genere uno nuevo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <InviteClient
      token={token}
      businessName={data.businessName}
      expiresAt={data.expiresAt}
      usesLeft={data.usesLeft}
    />
  );
}
