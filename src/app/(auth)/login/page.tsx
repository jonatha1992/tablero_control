'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { login, loginWithGoogle } from '@/lib/firebase/auth';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { isAuthenticated, loading: authLoading, user, notInvited } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user) {
      router.push(user.role === 'superadmin' ? '/superadmin' : '/dashboard');
    }
  }, [isAuthenticated, authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.refresh();
    } catch (err) {
      setError('Email o contraseña incorrectos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result) router.refresh();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Google Sign-In no está configurado para este dominio. Contacta al administrador.');
      } else {
        setError('Error al iniciar sesión con Google');
      }
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header fuera de la card */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center">
            <Image
              src="/icon-192.png"
              alt="Tablero de Control"
              width={88}
              height={88}
              className="rounded-3xl object-contain shadow-xl"
              priority
            />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Tablero de Control</h1>
          <p className="mt-2 text-base text-muted-foreground">Iniciá sesión para continuar</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border bg-card p-8 shadow-lg">
          {/* Alerta not_invited */}
          {notInvited && (
            <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
              Tu cuenta no está registrada en el sistema. Pedile a tu administrador que te invite.
            </div>
          )}

          {/* Error general */}
          {error && (
            <div className="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Google Sign-In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Conectando con Google...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continuar con Google
              </div>
            )}
          </Button>

          {/* Divisor */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-3 text-muted-foreground tracking-wider">O continuá con email</span>
            </div>
          </div>

          {/* Formulario email/password */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
                <Link href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline hover:text-primary transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="flex h-11 w-full rounded-lg border border-input bg-background px-4 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
              />
            </div>
            <Button type="submit" className="w-full h-12 text-base font-medium" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </Button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿No tenés cuenta?{' '}
            <Link href="/register" className="text-primary font-medium underline-offset-4 hover:underline transition-colors">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
