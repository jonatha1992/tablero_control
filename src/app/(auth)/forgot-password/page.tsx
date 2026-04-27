'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

type Step = 'form' | 'sent';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json() as { success?: boolean; error?: string };

      if (!res.ok) {
        setError(
          data.error === 'send_failed'
            ? 'No se pudo enviar el correo. Intentá de nuevo.'
            : 'Ocurrió un error inesperado.'
        );
        return;
      }

      setStep('sent');
    } catch {
      setError('Error de conexión. Verificá tu internet e intentá de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center">
            <Image
              src="/icon-192.png"
              alt="Tablero de Control"
              width={72}
              height={72}
              className="rounded-2xl object-contain shadow-md"
              priority
            />
          </div>
          <CardTitle className="text-2xl">Recuperar contraseña</CardTitle>
          <CardDescription>
            {step === 'form'
              ? 'Ingresá tu email y te enviamos un link para restablecer tu contraseña.'
              : 'Revisá tu bandeja de entrada.'}
          </CardDescription>
        </CardHeader>

        <CardContent>
          {step === 'form' ? (
            <>
              {error && (
                <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                </Button>
              </form>
            </>
          ) : (
            <div className="rounded-md bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 p-4 text-sm text-green-700 dark:text-green-300 text-center">
              Si <strong>{email}</strong> tiene una cuenta, recibirá el link en los próximos minutos.
              Revisá también la carpeta de spam.
            </div>
          )}
        </CardContent>

        <CardFooter className="justify-center">
          <Link href="/login" className="text-sm text-primary underline hover:text-primary/80">
            Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
