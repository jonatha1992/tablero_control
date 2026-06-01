'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Building2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { LABELS } from '@/lib/terminology';

interface Props {
  activeTeamName?: string;
}

export function CreateOwnBusinessCard({ activeTeamName }: Props) {
  const { user, refreshProfile, switchBusiness } = useAuth();
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user || user.hasOwnedBusiness) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const trimmed = businessName.trim();
    if (!trimmed) {
      setError(`Ingresá un nombre para tu ${LABELS.space.toLowerCase()}`);
      return;
    }

    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error('Sesión expirada');

      const res = await fetch('/api/businesses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error || `No se pudo crear el ${LABELS.space.toLowerCase()}`);
      }

      const created = await res.json() as { id: string };
      await refreshProfile();
      await switchBusiness(created.id);
    } catch (err: unknown) {
      setError((err as Error).message || `Error al crear el ${LABELS.space.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }

  const teamLabel = activeTeamName ? `el equipo de ${activeTeamName}` : 'tu equipo actual';

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">Armar tu {LABELS.space.toLowerCase()}</CardTitle>
        </div>
        <CardDescription className="text-xs">
          Estás trabajando en {teamLabel}. Si querés gestionar tu propio equipo y facturación, creá un {LABELS.space.toLowerCase()} acá.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-3">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="space-y-2">
            <label htmlFor="own-business-name" className="text-sm font-medium">
              Nombre del {LABELS.space.toLowerCase()}
            </label>
            <input
              id="own-business-name"
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Mi espacio"
              maxLength={100}
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando...
              </>
            ) : (
              'Crear mi espacio'
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            También podés usar el selector en el header para{' '}
            <Link href="/register?newBusiness=true" className="text-primary underline">
              crear otro espacio
            </Link>
            .
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
