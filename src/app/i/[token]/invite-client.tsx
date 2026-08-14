'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/auth-context';
import { useAcceptInvite } from '@/hooks/mutations/use-accept-invite';
import { loginWithGoogle, register, login } from '@/lib/firebase/auth';
import { invitesApi } from '@/lib/api/invites';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, ArrowRight, Loader2, CheckCircle, AlertTriangle, LogIn, Eye, EyeOff, Copy, Check } from 'lucide-react';

const IS_EMULATOR = process.env.NEXT_PUBLIC_USE_EMULATOR === 'true';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signupLoading, setSignupLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [createdUsername, setCreatedUsername] = useState<string | null>(null);
  const [usernameCopied, setUsernameCopied] = useState(false);

  async function handleJoin(username?: string) {
    setError('');
    try {
      await accept.mutateAsync(username ? { token, username } : token);
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
      } else if (message.includes('username_already_exists')) {
        setError('Ese nombre ya está en uso. Probá con una variante de tu nombre.');
      } else {
        setError('Ocurrió un error al unirte al equipo. Intentalo de nuevo.');
      }
    }
  }

  async function handleSignupAndJoin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const errors: Record<string, string> = {};

    if (!trimmedName) errors.name = 'El nombre es obligatorio';
    if (!trimmedEmail) errors.email = 'El correo es obligatorio';
    else if (!EMAIL_REGEX.test(trimmedEmail)) errors.email = 'El correo no es válido';
    if (password.length < 6) errors.password = 'La contraseña debe tener al menos 6 caracteres';
    if (password !== confirmPassword) errors.confirmPassword = 'Las contraseñas no coinciden';

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSignupLoading(true);
    try {
      let credentials = await invitesApi.prepareAccount(token, trimmedName, trimmedEmail);

      const attemptRegister = async () => {
        try {
          await register(credentials.email, password, trimmedName);
        } catch (err: unknown) {
          const code = (err as { code?: string }).code;
          if (code === 'auth/email-already-in-use') {
            await login(credentials.email, password);
            return;
          }
          throw err;
        }
      };

      try {
        await attemptRegister();
      } catch (err: unknown) {
        const message = (err as Error).message || '';
        if (message.includes('username_already_exists') || message.includes('email-already-in-use')) {
          credentials = await invitesApi.prepareAccount(token, trimmedName, trimmedEmail);
          await attemptRegister();
        } else {
          throw err;
        }
      }

      await accept.mutateAsync({ token, username: credentials.username });
      setCreatedUsername(credentials.username);
      await refreshProfile();
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/weak-password') {
        setError('La contraseña es demasiado débil');
      } else if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        setError('Ya existe una cuenta con esos datos. Iniciá sesión con tu nombre y contraseña.');
      } else {
        const message = (err as Error).message || '';
        if (message.includes('invite_expired') || message.includes('invite_revoked') || message.includes('invite_max_uses')) {
          setError('Este link ya no es válido. Pedile a tu administrador que genere uno nuevo.');
        } else if (message.includes('email_already_exists')) {
          setError('Ya existe una cuenta con ese correo. Iniciá sesión para unirte al equipo.');
        } else if (message.includes('invalid_email')) {
          setError('El correo no es válido. Revisalo e intentá de nuevo.');
        } else if (message.includes('username_already_exists')) {
          setError('Ese nombre ya está en uso. Probá con una variante de tu nombre.');
        } else {
          setError('Ocurrió un error al crear tu cuenta. Intentalo de nuevo.');
        }
      }
    } finally {
      setSignupLoading(false);
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

  async function handleCopyUsername() {
    if (!createdUsername) return;
    await navigator.clipboard.writeText(createdUsername);
    setUsernameCopied(true);
    setTimeout(() => setUsernameCopied(false), 2000);
  }

  const signedInWithGoogle = firebaseUser?.providerData?.some(
    (provider) => provider.providerId === 'google.com'
  );

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
                <p className="text-green-700 dark:text-green-400 font-medium">
                  {createdUsername ? 'Cuenta creada correctamente' : '¡Te uniste exitosamente!'}
                </p>
                {createdUsername ? (
                  <div className="space-y-3 rounded-lg border bg-muted/40 p-4 text-left">
                    <p className="text-xs text-muted-foreground">Tu usuario para ingresar</p>
                    <div className="flex items-center gap-2">
                      <code className="min-w-0 flex-1 truncate rounded bg-background px-3 py-2 text-sm font-semibold">
                        {createdUsername}
                      </code>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleCopyUsername}
                        aria-label="Copiar usuario"
                        title="Copiar usuario"
                      >
                        {usernameCopied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      La próxima vez ingresá con este usuario o tu correo, y tu contraseña.
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {signedInWithGoogle
                      ? 'Para volver a entrar, usá Continuar con Google.'
                      : 'Para volver a entrar, usá tu usuario o correo y contraseña.'}
                  </p>
                )}
                <Button onClick={() => router.push('/dashboard')} className="w-full">
                  Ir al dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <p className="text-sm text-center text-muted-foreground">
                  Estás logueado como <strong>{user?.email ?? firebaseUser?.email}</strong>
                </p>
                <Button onClick={() => handleJoin()} disabled={accept.isPending} className="w-full h-11">
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
                <p className="text-xs text-center text-muted-foreground">
                  No vas a crear un negocio nuevo; te sumás al equipo de <strong>{businessName}</strong>.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={handleSignupAndJoin} className="space-y-3">
              <p className="text-sm text-center text-muted-foreground">
                Creá tu cuenta para unirte al equipo
              </p>

              <div className="space-y-2">
                <label htmlFor="invite-name" className="text-sm font-medium">
                  Tu nombre
                </label>
                <Input
                  id="invite-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Juan García"
                  required
                  maxLength={100}
                  autoComplete="name"
                />
                {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="invite-email" className="text-sm font-medium">
                  Tu correo
                </label>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan@empresa.com"
                  required
                  maxLength={150}
                  autoComplete="email"
                />
                {fieldErrors.email ? (
                  <p className="text-xs text-destructive">{fieldErrors.email}</p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Lo usamos para que puedas recuperar tu cuenta.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="invite-password" className="text-sm font-medium">
                  Contraseña
                </label>
                <div className="relative">
                  <Input
                    id="invite-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}
              </div>

              <div className="space-y-2">
                <label htmlFor="invite-confirm-password" className="text-sm font-medium">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <Input
                    id="invite-confirm-password"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repetí la contraseña"
                    required
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={signupLoading || accept.isPending}>
                {signupLoading || accept.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creando cuenta y uniéndote...
                  </>
                ) : (
                  <>
                    Unirme al equipo <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                No vas a crear un negocio nuevo; te sumás al equipo de <strong>{businessName}</strong>.
                Para volver a entrar usá tu correo y contraseña.
              </p>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">o</span>
              </div>
            </div>

            {IS_EMULATOR ? (
              <div className="rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
                <span className="font-semibold">Modo emulador</span> — Google Sign-In no está disponible.
                Usá el formulario de arriba con nombre y contraseña.
              </div>
            ) : (
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
                  <span className="flex items-center gap-3">
                    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar con Google
                  </span>
                )}
              </Button>
            )}

            <Link href={`/login?redirect=${redirectParam}`} className="block">
              <Button variant="ghost" className="w-full h-11">
                <LogIn className="mr-2 h-4 w-4" />
                ¿Ya tenés cuenta? Iniciá sesión
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
