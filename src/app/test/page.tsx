'use client';

import { useState } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { Button } from '@/components/ui/button';

export default function TestPage() {
  const [clientStatus, setClientStatus] = useState<string>('Not tested');
  const [backendStatus, setBackendStatus] = useState<string>('Not tested');
  
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
        setBackendStatus(`Success! Data: ${data.data.message}`);
      } else {
        setBackendStatus(`Error: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      setBackendStatus(`Fetch Error: ${e.message}`);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold">Frontend / Backend Integration Test</h1>
      
      <div className="space-y-4 border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold">1. Test Firebase Client SDK</h2>
        <p className="text-sm text-muted-foreground">
          This tests if the Next.js client component can communicate directly with the Firebase Firestore via the Client SDK.
        </p>
        <Button onClick={testClient}>Run Client Test</Button>
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          Status: <span className={clientStatus.includes('Error') ? 'text-red-500' : clientStatus.includes('Success') ? 'text-green-500' : ''}>{clientStatus}</span>
        </div>
      </div>

      <div className="space-y-4 border p-6 rounded-lg bg-card">
        <h2 className="text-xl font-semibold">2. Test Server API (Next.js to Backend)</h2>
        <p className="text-sm text-muted-foreground">
          This tests if the Next.js API route can communicate with the Firebase Admin SDK to write/read.
        </p>
        <Button onClick={testBackend} variant="secondary">Run Backend Test</Button>
        <div className="p-4 bg-muted rounded-md font-mono text-sm">
          Status: <span className={backendStatus.includes('Error') ? 'text-red-500' : backendStatus.includes('Success') ? 'text-green-500' : ''}>{backendStatus}</span>
        </div>
      </div>
    </div>
  );
}
