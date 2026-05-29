'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth-context';
import { useAcceptInvite } from '@/hooks/mutations/use-accept-invite';
import { loginWithGoogle } from '@/lib/firebase/auth';
import { Button } from '@/components/ui/button';
import { Users, ArrowRight, Loader2, CheckCircle, AlertTriangle, LogIn } from 'lucide-react';
interface Props {
  token: string;
  businessName: string;
  expiresAt?: string;
  usesLeft?: number | null;
}

export function InviteClient({ token, businessName, expiresAt, usesLeft }: Props) {
  const { user, firebaseUser, isAuthenticated, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const accept = useAcceptInvite();
  const [error, setError] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleJoin() {
    setError('');
    try {
      await accept.mutateAsync(token);
      await refreshProfile();
    } catch (err: unknown) {
      const message = (err as Error).message || '';
      if (message.includes('already_member')) {
        setError('Ya sos parte de este equipo.');
      } else if (message.includes('already_in_other_business')) {
        setError('Ya pertenecés a otro equipo. No podés unirte a este.');
      } else if (message.includes('members_limit_exceeded')) {
        setError('Este equipo alcanzó el límite de miembros de su plan.');
      } else if (message.includes('invite_expired') || message.includes('invite_revoked') || message.includes('invite_max_uses')) {
        setError('Este link ya no es válido. Pedile a tu administrador que genere uno nuevo.');
      } else {
        setError('Ocurrió un error al unirte al equipo. Intentalo de nuevo.');
      }
    }
  }

  const redirectParam = encodeURIComponent(`/i/${token}`);
  const invitePath = `/i/${token}`;

  async function handleGoogleSignIn() {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result) return;

      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${result.token}` },
      });

      if (profileRes.status === 404) {
        router.push(invitePath);
        return;
      }
      if (!profileRes.ok) {
        throw new Error('Error al cargar el perfil');
      }

      await refreshProfile();
      router.push(invitePath);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code !== 'auth/popup-closed-by-user') {
        setError((err as Error).message || 'Error al iniciar sesión con Google');
      }
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 bg-gradient-to-br from-background via-muted/20 to-background">
      <div className="w-full max-w-md rounded-2xl border bg-card p-8 shadow-lg">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">¡Te invitaron a unirte!</h1>
          <p className="mt-2 text-muted-foreground">
            <strong>{businessName}</strong> te invita a formar parte de su equipo.
          </p>
        </div>

        <div className="rounded-lg border bg-muted/40 p-4 space-y-3 text-sm mb-6">
          {expiresAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Expira</span>
              <span className="font-medium">{new Date(expiresAt).toLocaleDateString('es-AR')}</span>
            </div>
          )}
          {usesLeft !== null && usesLeft !== undefined && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Usos restantes</span>
              <span className="font-medium">{usesLeft}</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isAuthenticated ? (
          <div className="space-y-3">
            {accept.isSuccess ? (
              <div className="text-center space-y-3">
                <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
                <p className="text-green-700 dark:text-green-400 font-medium">¡Te uniste exitosamente!</p>
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Ir al dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-center text-muted-foreground">
                  Estás logueado como <strong>{user?.email ?? firebaseUser?.email}</strong>
                </p>
                <Button onClick={handleJoin} disabled={accept.isPending} className="w-full h-11">
                  {accept.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uniendo...
                    </>
                  ) : (
                    <>
                      Unirme al equipo <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-center text-muted-foreground">
              Para unirte, necesitás iniciar sesión o crear una cuenta.
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Conectando con Google...
                </>
              ) : (
                'Continuar con Google'
              )}
            </Button>
            <Link href={`/login?redirect=${redirectParam}`} className="block">
              <Button variant="default" className="w-full h-11">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar sesión
              </Button>
            </Link>
            <Link href={`/register?redirect=${redirectParam}`} className="block">
              <Button variant="outline" className="w-full h-11">
                Crear cuenta
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
