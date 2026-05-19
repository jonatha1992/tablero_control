'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/auth-context';
import { can } from '@/lib/permissions';
import { useTheme } from 'next-themes';
import { User, Bell, Palette, Globe, Shield, Camera, CheckCircle2, AlertCircle, Sun, Moon, Monitor, CreditCard } from 'lucide-react';
import Image from 'next/image';
import { auth } from '@/lib/firebase/client';
import { resetPassword } from '@/lib/firebase/auth';
import { InstallPwaCard } from './install-pwa-card';
import { PushNotificationToggle } from './push-notification-toggle';
import { BillingPlanCards } from '@/components/billing/billing-plan-cards';
import { BillingCurrentPlan } from '@/components/billing/billing-current-plan';
import { BillingInvoices } from '@/components/billing/billing-invoices';
import { useSubscriptionQuery } from '@/hooks/queries/use-subscription-query';

export default function ConfigPage() {
  const { user } = useAuth();
  const canManageBilling = user ? (user.isOwner || can(user, 'business.subscription.manage')) : false;
  const { theme, setTheme } = useTheme();
  const searchParams = useSearchParams();
  const { data: subscription, isLoading } = useSubscriptionQuery(user?.businessId);
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'perfil');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(window.location.search);
    if (tab === 'perfil') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const qs = params.toString();
    const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`;
    window.history.replaceState(null, '', url);
  };
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [resetState, setResetState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saveState, setSaveState] = useState<'idle' | 'loading' | 'saved' | 'error'>('idle');
  const [fieldError, setFieldError] = useState('');

  const handleSave = useCallback(async () => {
    if (saveState === 'loading') return;
    setFieldError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setFieldError('El nombre no puede estar vacío');
      return;
    }

    setSaveState('loading');
    try {
      const token = await auth.currentUser?.getIdToken();
      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, phone: phone.trim() }),
      });
      setSaveState(res.ok ? 'saved' : 'error');
      if (res.ok) setTimeout(() => setSaveState('idle'), 2500);
    } catch {
      setSaveState('error');
    }
  }, [saveState, name, phone]);

  const handleResetPassword = useCallback(async () => {
    if (!user?.email || resetState === 'loading' || resetState === 'sent') return;
    setResetState('loading');
    try {
      await resetPassword(user.email);
      setResetState('sent');
    } catch {
      setResetState('error');
    }
  }, [user?.email, resetState]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setIsUploading(true);

      // 1. Upload to Cloudinary via API route
      const form = new FormData();
      form.append('file', file);
      form.append('type', 'avatar');
      form.append('id', user.id);

      const uploadRes = await fetch('/api/upload', { method: 'POST', body: form });
      if (!uploadRes.ok) throw new Error('Error al subir la imagen');
      const { url } = await uploadRes.json() as { url: string };

      // 2. Save URL in PostgreSQL
      const token = await auth.currentUser?.getIdToken();
      await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      });

      setAvatarUrl(url);
    } catch (error) {
      console.error('Error al subir avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-5xl mx-auto w-full gap-4">
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col min-h-0">
        <TabsList className="shrink-0 justify-start w-full bg-transparent border-b rounded-none px-0 gap-4 mb-4">
          <TabsTrigger value="perfil" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">
            <User className="h-4 w-4 mr-2" /> Mi Perfil
          </TabsTrigger>
          <TabsTrigger value="preferencias" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">
            <Palette className="h-4 w-4 mr-2" /> Preferencias
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">
            <Bell className="h-4 w-4 mr-2" /> Notificaciones
          </TabsTrigger>
          {canManageBilling && (
            <TabsTrigger value="facturacion" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2">
              <CreditCard className="h-4 w-4 mr-2" /> Facturación
            </TabsTrigger>
          )}
        </TabsList>

        <div className="flex-1 overflow-y-auto">
          {/* PERFIL */}
          <TabsContent value="perfil" className="mt-0 space-y-4 outline-none">
            <Card className="border-border/50 shadow-sm glass">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Información Personal</CardTitle>
                <CardDescription className="text-xs">Actualiza tus datos de contacto y rol.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <div className="w-20 h-20 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-all relative">
                      {(avatarUrl || user?.avatar) ? (
                        <Image src={avatarUrl || user!.avatar!} alt="Avatar" width={80} height={80} className="w-full h-full object-cover" unoptimized />
                      ) : (
                        <span className="text-2xl font-bold uppercase">{user?.name?.substring(0, 2) || 'TC'}</span>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                        <Camera className="w-6 h-6 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium">Cambiar</span>
                      </div>
                    </div>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={isUploading}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{user?.name}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    {isUploading && <p className="text-xs text-primary mt-1 animate-pulse font-medium">Subiendo imagen, espera por favor...</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Nombre Completo</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Correo Electrónico</label>
                    <input type="email" disabled value={user?.email || ''} readOnly className="w-full h-9 rounded-md border bg-muted px-3 py-1 text-sm opacity-50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" maxLength={50} className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Rol Asignado</label>
                    <input type="text" disabled defaultValue={user?.role?.toUpperCase() || ''} className="w-full h-9 rounded-md border bg-muted px-3 py-1 text-sm opacity-50 cursor-not-allowed" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-3 flex items-center gap-3">
                <Button size="sm" onClick={handleSave} disabled={saveState === 'loading'}>
                  {saveState === 'loading' ? 'Guardando...' : 'Guardar cambios'}
                </Button>
                {fieldError && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {fieldError}
                  </span>
                )}
                {saveState === 'saved' && (
                  <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Guardado
                  </span>
                )}
                {saveState === 'error' && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> Error al guardar
                  </span>
                )}
              </CardFooter>
            </Card>

            <Card className="border-destructive/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center text-destructive"><Shield className="h-4 w-4 mr-2" /> Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Si deseas cambiar tu contraseña, se te enviará un correo de recuperación a <strong>{user?.email}</strong>.
                </p>
                {resetState === 'sent' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Correo enviado. Revisá tu bandeja de entrada.
                  </p>
                )}
                {resetState === 'error' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> No se pudo enviar el correo. Intentá de nuevo.
                  </p>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={handleResetPassword}
                  disabled={resetState === 'loading' || resetState === 'sent'}
                >
                  {resetState === 'loading' ? 'Enviando...' : resetState === 'sent' ? 'Correo enviado' : 'Restablecer contraseña'}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* PREFERENCIAS */}
          <TabsContent value="preferencias" className="mt-0 space-y-4 outline-none">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Aspecto visual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Tema de la aplicación</label>
                  <div className="flex gap-4">
                    <label className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer border p-3 rounded-md transition-colors flex-1 justify-center",
                      theme === 'light' ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}>
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'light'} onChange={() => setTheme('light')} /> <Sun className="h-4 w-4" /> Claro
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer border p-3 rounded-md transition-colors flex-1 justify-center",
                      theme === 'dark' ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}>
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> <Moon className="h-4 w-4" /> Oscuro
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer border p-3 rounded-md transition-colors flex-1 justify-center",
                      theme === 'system' ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}>
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'system'} onChange={() => setTheme('system')} /> <Monitor className="h-4 w-4" /> Sistema
                    </label>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-3">
                <Button size="sm">Actualizar preferencias</Button>
              </CardFooter>
            </Card>

            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center"><Globe className="h-4 w-4 mr-2" /> Regional</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Zona Horaria</label>
                  <select className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    <option value="America/Santiago">Santiago (GMT-4)</option>
                    <option value="Europe/Madrid">Madrid (GMT+1)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground block">Idioma</label>
                  <select className="flex h-9 w-full rounded-md border bg-background px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <InstallPwaCard />
          </TabsContent>

          {/* NOTIFICACIONES */}
          <TabsContent value="notificaciones" className="mt-0 space-y-4 outline-none">
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold">Alertas y Avisos</CardTitle>
                <CardDescription className="text-xs">Elige cómo quieres que te contactemos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <p className="text-sm font-medium">Correos electrónicos</p>
                    <p className="text-xs text-muted-foreground">Recibe un resumen diario y alertas urgentes por mail.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                </div>
                <PushNotificationToggle />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Reportes automatizados (Agentes AI)</p>
                    <p className="text-xs text-muted-foreground">Notificaciones cuando la IA detecte cuellos de botella.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FACTURACIÓN */}
          {canManageBilling && (
          <TabsContent value="facturacion" className="mt-0 space-y-8 outline-none">
            {!user?.businessId ? (
              <p className="text-muted-foreground text-sm">No tenés una suscripción activa.</p>
            ) : (
              <>
                <BillingCurrentPlan subscription={subscription ?? null} isLoading={isLoading} />
                <div>
                  <h2 className="text-lg font-semibold mb-4">Cambiar plan</h2>
                  <BillingPlanCards currentPlan={subscription?.plan ?? 'free'} businessId={user.businessId} />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-4">Historial de pagos</h2>
                  <BillingInvoices businessId={user.businessId} subscriptionId={subscription?.id} />
                </div>
              </>
            )}
          </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
