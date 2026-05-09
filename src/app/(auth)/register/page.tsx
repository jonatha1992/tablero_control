'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { register, login } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const { isAuthenticated, loading: authLoading, user, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/dashboard';
  const isNewBusiness = searchParams.get('newBusiness') === 'true';

  useEffect(() => {
    if (!authLoading && isAuthenticated && user && !isNewBusiness) {
      const target = redirect !== '/dashboard' ? redirect : (user.role === 'superadmin' ? '/superadmin' : '/dashboard');
      router.push(target);
    }
  }, [isAuthenticated, authLoading, user, router, isNewBusiness, redirect]);

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmedName = businessName.trim();
    if (!trimmedName) {
      setFieldErrors({ businessName: 'El nombre del negocio es obligatorio' });
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
      if (!res.ok) throw new Error('Error al crear el negocio');
      await refreshProfile();
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as Error).message || 'Error al crear el negocio');
    } finally {
      setLoading(false);
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
    if (!trimmedBusinessName) errors.businessName = 'El nombre del negocio es obligatorio';
    if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setLoading(true);

    try {
      // 1. Create Firebase user (or sign in if already exists)
      try {
        await register(trimmedEmail, password, trimmedName, 'miembro');
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (code === 'auth/email-already-in-use') {
          await login(email, password);
        } else {
          throw err;
        }
      }
      // onAuthStateChanged fires but won't sign out (we're on /register)

      // 2. Provision user + business in DB
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('No se pudo obtener el token de autenticación');

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ businessName: trimmedBusinessName || undefined }),
      });

      if (!res.ok) {
        throw new Error('Error al crear el negocio. Inténtalo de nuevo.');
      }

      // 3. Load profile into context (triggers redirect via useEffect)
      await refreshProfile();
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
          <CardTitle className="text-2xl">Nuevo Negocio</CardTitle>
          <CardDescription>Creá un nuevo negocio para gestionar</CardDescription>
        </CardHeader>
        <form onSubmit={handleCreateBusiness}>
          <CardContent className="space-y-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label htmlFor="businessName" className="text-sm font-medium">Nombre del negocio</label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Mi nuevo negocio"
                required
                maxLength={100}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              {fieldErrors.businessName && <p className="text-xs text-destructive">{fieldErrors.businessName}</p>}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creando negocio...' : 'Crear negocio'}
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

  if (isAuthenticated) return null;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
          <Image src="/icon-192.png" alt="Tablero de Control" width={48} height={48} className="rounded-xl object-contain" priority />
        </div>
        <CardTitle className="text-2xl">Crear Cuenta</CardTitle>
        <CardDescription>Registrá tu negocio para acceder al tablero</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
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
          <div className="space-y-2">
            <label htmlFor="businessName" className="text-sm font-medium">
              Nombre del negocio <span className="text-muted-foreground font-normal">(opcional)</span>
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
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contraseña"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={loading}>
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
            <Link href="/login" className="text-primary underline hover:text-primary/80">
              Iniciá sesión
            </Link>
          </p>
        </CardFooter>
      </form>
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
