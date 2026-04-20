'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [clientStatus, setClientStatus] = useState<string>('Esperando...');
  const [backendStatus, setBackendStatus] = useState<string>('Esperando...');
  
  // States for mail tests
  const [testEmail, setTestEmail] = useState('');
  const [mailStatus, setMailStatus] = useState<string>('Not tested');
  const [loadingMail, setLoadingMail] = useState<string | null>(null);

  const runMailTest = async (action: 'welcome' | 'reset' | 'invite') => {
    if (!testEmail) {
      alert('Por favor, ingresa un email para la prueba');
      return;
    }

    setLoadingMail(action);
    setMailStatus(`Enviando ${action}...`);

    try {
      const res = await fetch('/api/test/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail, action })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMailStatus(`Éxito: ${data.message}`);
      } else {
        setMailStatus(`Error: ${data.error || 'Fallo desconocido'}`);
      }
    } catch (e: any) {
      setMailStatus(`Error de red: ${e.message}`);
    } finally {
      setLoadingMail(null);
    }
  };

  const testClient = async () => {
    try {
      setClientStatus('Testing...');
      const docRef = doc(db, 'test', 'client-test');
      await setDoc(docRef, {
        timestamp: new Date().toISOString(),
        message: 'Hello from Firebase Client SDK!',
        source: 'client',
      });
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClientStatus(`Success! Data: ${docSnap.data().message}`);
      } else {
        setClientStatus('Error: Document not found after write');
      }
    } catch (e: any) {
      setClientStatus(`Error: ${e.message}`);
    }
  };

  const testBackend = async () => {
    try {
      setBackendStatus('Testing...');
      const res = await fetch('/api/test');
      const data = await res.json();
      if (res.ok && data.success) {
        setBackendStatus(`Success! User count: ${data.userCount}`);
      } else {
        setBackendStatus(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setBackendStatus(`Fetch Error: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Suite de Pruebas Integrales</h1>
      </div>

      {/* SECCIÓN 1: ESTADO DE SESIÓN */}
      <Card>
        <CardHeader>
          <CardTitle>1. Estado de Sesión (Auth Context)</CardTitle>
          <CardDescription>Verifica si el contexto de autenticación reconoce al usuario.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className={`h-3 w-3 rounded-full ${isAuthenticated ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium">
              {authLoading ? 'Cargando Auth...' : isAuthenticated ? 'Autenticado' : 'No Autenticado'}
            </span>
          </div>
          {isAuthenticated && user && (
            <div className="bg-muted p-3 rounded-md text-sm font-mono break-all">
              ID: {user.uid} <br />
              Email: {user.email} <br />
              Role: {(user as any).role || 'member'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECCIÓN 2: FIREBASE Y BACKEND */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Database (Client SDK)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testClient} size="sm" className="w-full">Probar Firestore</Button>
            <div className="p-3 bg-muted rounded-md text-xs font-mono min-h-[40px]">
              {clientStatus}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Connect / Admin SDK</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={testBackend} variant="secondary" size="sm" className="w-full">Probar Backend API</Button>
            <div className="p-3 bg-muted rounded-md text-xs font-mono min-h-[40px]">
              {backendStatus}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECCIÓN 3: SISTEMA DE EMAILS (RESEND + REACT EMAIL) */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle>3. Sistema de Mails y Recuperación</CardTitle>
          <CardDescription>Prueba el envío de correos transaccionales con diseño premium.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="test-email">Email de Destino (Usa uno real para verificar)</Label>
            <Input 
              id="test-email" 
              placeholder="tu-email@ejemplo.com" 
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button 
                variant="outline" 
                onClick={() => runMailTest('welcome')}
                disabled={!!loadingMail}
            >
              {loadingMail === 'welcome' ? 'Enviando...' : 'Test Bienvenida'}
            </Button>
            <Button 
                variant="outline" 
                onClick={() => runMailTest('invite')}
                disabled={!!loadingMail}
            >
              {loadingMail === 'invite' ? 'Enviando...' : 'Test Invitación'}
            </Button>
            <Button 
                variant="default" 
                onClick={() => runMailTest('reset')}
                disabled={!!loadingMail}
            >
              {loadingMail === 'reset' ? 'Enviando...' : 'Test Recuperación'}
            </Button>
          </div>

          <div className="p-4 bg-background border rounded-md font-mono text-sm">
            Resultado Mail: <span className={mailStatus.includes('Error') ? 'text-red-500' : mailStatus.includes('Éxito') ? 'text-green-500' : ''}>
                {mailStatus}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* SECCIÓN 4: TEST DE PAGOS (PLACEHOLDER) */}
      <Card className="opacity-60 grayscale">
        <CardHeader>
          <CardTitle>4. Módulo de Pagos (Mercado Pago / Stripe)</CardTitle>
          <CardDescription>Pruebas de suscripciones y transacciones (Próximamente).</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            Esta sección se habilitará una vez se defina la integración de la pasarela de pagos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
