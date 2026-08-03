'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { register, login, loginWithGoogle } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LABELS } from '@/lib/terminology';

const IS_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function provisionOwnerAccount(token: string, businessName?: string) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ businessName: businessName?.trim() || undefined }),
  });
  if (!res.ok) {
    throw new Error(`Error al crear el ${LABELS.space.toLowerCase()}. Inténtalo de nuevo.`);
  }
}

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { isAuthenticated, loading: authLoading, user, firebaseUser, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const isNewBusiness = searchParams.get('newBusiness') === 'true';
  const isInviteRedirect = redirect.startsWith('/i/');
  // Google (u otro provider) ya autenticó en Firebase pero aún no hay fila en PG
  const needsOwnerProvision =
    !authLoading && isAuthenticated && !user && !isInviteRedirect && !isNewBusiness;

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !isNewBusiness) {
      const target = redirect !== '/dashboard' ? redirect : (user.role === 'superadmin' ? '/superadmin' : '/dashboard');
      router.push(target);
    }
  }, [isAuthenticated, authLoading, user, router, isNewBusiness, redirect]);

  // Invitación: Firebase autenticado pero sin perfil PG → volver al link para aceptar
  useEffect(() => {
    if (!authLoading && isAuthenticated && !user && isInviteRedirect) {
      router.push(redirect);
    }
  }, [authLoading, isAuthenticated, user, isInviteRedirect, redirect, router]);

  // Prefill nombre/email desde la sesión Firebase (p. ej. Google primer ingreso)
  useEffect(() => {
    if (!needsOwnerProvision || !firebaseUser) return;
    setName((prev) => prev || firebaseUser.displayName || '');
    setEmail((prev) => prev || firebaseUser.email || '');
  }, [needsOwnerProvision, firebaseUser]);

  const finishOwnerSignup = async (token: string, trimmedBusinessName?: string) => {
    await provisionOwnerAccount(token, trimmedBusinessName);
    await refreshProfile();
    const target = redirect && redirect !== '/dashboard' ? redirect : '/dashboard';
    router.push(target);
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setFieldErrors({ businessName: `El nombre del ${LABELS.space.toLowerCase()} es obligatorio` });
      return;
    }
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');
      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName }),
      });
      if (!res.ok) throw new Error(`Error al crear el ${LABELS.space.toLowerCase()}`);
      await refreshProfile();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || `Error al crear el ${LABELS.space.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  };

  /** Completa el alta de dueño cuando ya hay sesión Firebase (Google u otro) sin perfil PG. */
  const handleCompleteGoogleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token');
      await finishOwnerSignup(token, businessName.trim() || undefined);
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      const result = await loginWithGoogle();
      if (!result) return; // redirect flow — onAuthStateChanged + needsOwnerProvision

      const profileRes = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${result.token}` },
      });
      if (profileRes.ok) {
        await refreshProfile();
        router.push(redirect !== '/dashboard' ? redirect : '/dashboard');
        return;
      }
      if (profileRes.status === 404) {
        // Sesión lista: el formulario de completar alta se muestra vía needsOwnerProvision
        setName(result.user.displayName || '');
        setEmail(result.user.email || '');
        return;
      }
      throw new Error('Error al verificar la cuenta');
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-closed-by-user') {
        setError('');
      } else if (code === 'auth/unauthorized-domain') {
        setError('Registro con Google no está configurado para este dominio. Contactá al administrador.');
      } else {
        setError((err as Error).message || 'Error al registrarse con Google');
      }
      console.error(err);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const errors: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedBusinessName = businessName.trim();

    if (!trimmedName) errors.name = 'El nombre es obligatorio';
    if (!trimmedEmail) errors.email = 'El correo es obligatorio';
    else if (!EMAIL_REGEX.test(trimmedEmail)) errors.email = 'Ingresá un correo válido';
    // businessName es opcional: la API usa defaultSpaceName(name) si falta
    if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase user (or sign in if already exists)
      let token: string;
      try {
        const result = await register(trimmedEmail, password, trimmedName, 'miembro');
        token = result.token;
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === 'auth/email-already-in-use') {
          const result = await login(trimmedEmail, password);
          token = result.token;
        } else {
          throw err;
        }
      }

      if (isInviteRedirect) {
        router.push(redirect);
        return;
      }

      // 2. Provision user + business in DB (flujo negocio nuevo)
      await finishOwnerSignup(token, trimmedBusinessName || undefined);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Este correo ya está registrado. Verificá tu contraseña.');
      } else if (code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil');
      } else {
        setError((err as Error).message || 'Error al crear la cuenta. Inténtalo de nuevo.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated && isNewBusiness) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image src="/icon-192.png" alt="Tablero de Control" width={48} height={48} className="rounded-xl object-contain" priority />
          </div>
          <CardTitle className="text-2xl">Nuevo {LABELS.space}</CardTitle>
          <CardDescription>Creá un nuevo {LABELS.space.toLowerCase()} para gestionar</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateBusiness}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">Nombre del {LABELS.space.toLowerCase()}</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={`Mi nuevo ${LABELS.space.toLowerCase()}`}
                required
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {fieldErrors.businessName && <p className="text-xs text-destructive">{fieldErrors.businessName}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? `Creando ${LABELS.space.toLowerCase()}...` : `Crear ${LABELS.space.toLowerCase()}`}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/dashboard" className="text-primary underline hover:text-primary/80">
                Volver al dashboard
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  if (isAuthenticated && user) return null;

  // Primer ingreso con Google (u otra sesión Firebase) sin perfil PG: solo falta crear el espacio
  if (needsOwnerProvision) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <Image src="/icon-192.png" alt="Tablero de Control" width={48} height={48} className="rounded-xl object-contain" priority />
          </div>
          <CardTitle className="text-2xl">Completá tu registro</CardTitle>
          <CardDescription>
            Entraste con {email || 'tu cuenta'}. Creá tu {LABELS.space.toLowerCase()} para empezar.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleCompleteGoogleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            {name ? (
              <p className="text-sm text-muted-foreground">
                Hola <span className="font-medium text-foreground">{name}</span>
              </p>
            ) : null}
            <div className="space-y-2">
              <label htmlFor="businessNameGoogle" className="text-sm font-medium">
                Nombre del {LABELS.space.toLowerCase()}{' '}
                <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                id="businessNameGoogle"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi Empresa S.A."
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear mi espacio'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Al continuar aceptás los{' '}
              <Link href="/terminos" className="underline underline-offset-4 hover:text-foreground transition-colors">Términos</Link>
              {' '}y la{' '}
              <Link href="/privacidad" className="underline underline-offset-4 hover:text-foreground transition-colors">Privacidad</Link>.
            </p>
          </CardFooter>
        </form>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <Image src="/icon-192.png" alt="Tablero de Control" width={48} height={48} className="rounded-xl object-contain" priority />
        </div>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>
          {isInviteRedirect
            ? 'Creá tu cuenta para unirte al equipo'
            : `Registrá tu ${LABELS.space.toLowerCase()} para acceder al tablero`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {!IS_EMULATOR && !isInviteRedirect && (
          <>
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={handleGoogleSignup}
              disabled={googleLoading || loading}
            >
              {googleLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Conectando con Google...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continuar con Google
                </span>
              )}
            </Button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground tracking-wider">O con correo</span>
              </div>
            </div>
          </>
        )}

        <form id="register-email-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Tu nombre</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Juan García"
              required
              maxLength={100}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>
          {!isInviteRedirect && (
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">
                Nombre del {LABELS.space.toLowerCase()} <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi Empresa S.A."
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {fieldErrors.businessName && <p className="text-xs text-destructive">{fieldErrors.businessName}</p>}
            </div>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Correo</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              required
              maxLength={150}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña</label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la contraseña"
                required
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showConfirm ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
            {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4">
        <Button type="submit" form="register-email-form" className="w-full" disabled={loading || googleLoading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>
        <p className="text-xs text-muted-foreground text-center">
          Al crear una cuenta aceptás los{' '}
          <Link href="/terminos" className="underline underline-offset-4 hover:text-foreground transition-colors">Términos y Condiciones</Link>
          {' '}y la{' '}
          <Link href="/privacidad" className="underline underline-offset-4 hover:text-foreground transition-colors">Política de Privacidad</Link>.
        </p>
        <p className="text-center text-sm text-muted-foreground">
          ¿Ya tenés cuenta?{' '}
          <Link
            href={isInviteRedirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login'}
            className="text-primary underline hover:text-primary/80"
          >
            Iniciá sesión
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    }>
      <RegisterForm />
    </Suspense>
  );
}
