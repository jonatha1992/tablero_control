'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [clientStatus, setClientStatus] = useState<string>('No probado');
  const [backendStatus, setBackendStatus] = useState<string>('No probado');
  
  const testClient = async () => {
    try {
      setClientStatus('Probando...');
      const docRef = doc(db, 'test', 'client-test');
      await setDoc(docRef, {
        timestamp: new Date().toISOString(),
        message: '¡Hola desde Firebase Client SDK!',
        source: 'client',
      });
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setClientStatus(`¡Éxito! Datos: ${docSnap.data().message}`);
      } else {
        setClientStatus('Error: Documento no encontrado después de escritura');
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setClientStatus(`Error: ${message}`);
    }
  };

  const testBackend = async () => {
    try {
      setBackendStatus('Probando...');
      const res = await fetch('/api/test');
      const data = await res.json();
      if (res.ok && data.success) {
        setBackendStatus(`¡Éxito! Datos: ${data.data.message}`);
      } else {
        setBackendStatus(`Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      setBackendStatus(`Error de conexión: ${message}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Prueba de Integración Frontend / Backend</h1>
      
      <div className="space-y-4 border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold">1. Probar Firebase Client SDK</h2>
        <p className="text-sm text-muted-foreground">
          Esto prueba si el componente cliente de Next.js puede comunicarse directamente con Firebase Firestore mediante el Client SDK.
        </p>
        <Button onClick={testClient}>Ejecutar prueba de cliente</Button>
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          Estado: <span className={clientStatus.includes('Error') ? 'text-red-500' : clientStatus.includes('Éxito') ? 'text-green-500' : ''}>{clientStatus}</span>
        </div>
      </div>

      <div className="space-y-4 border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold">2. Probar API del servidor (Next.js a Backend)</h2>
        <p className="text-sm text-muted-foreground">
          Esto prueba si la ruta API de Next.js puede comunicarse con Firebase Admin SDK para escribir/leer.
        </p>
        <Button onClick={testBackend} variant="secondary">Ejecutar prueba de backend</Button>
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          Estado: <span className={backendStatus.includes('Error') ? 'text-red-500' : backendStatus.includes('Éxito') ? 'text-green-500' : ''}>{backendStatus}</span>
        </div>
      </div>
    </div>
  );
}
