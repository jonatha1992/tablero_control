'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/auth-context';
import { useTheme } from 'next-themes';
import { User, Bell, Palette, Globe, Shield, Smartphone, Camera, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { uploadUserAvatar } from '@/lib/firebase/storage';
import { authService } from '@/services/auth.service';

export default function ConfigPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('perfil');
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    try {
      setIsUploading(true);
      const url = await uploadUserAvatar(user.id, file);
      await authService.updateUserProfile(user.id, { avatar: url });
      setAvatarUrl(url);
    } catch (error) {
      console.error('Error al subir avatar:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden max-w-5xl mx-auto w-full gap-4">
      <div className="shrink-0">
        <h1 className="text-xl font-bold">Configuración</h1>
        <p className="text-muted-foreground text-xs mt-0.5">Administra tus preferencias personales y de la plataforma.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
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
          {(user?.role === 'admin' || user?.role === 'superadmin') && (
            <Link
              href="/dashboard/config/roles"
              className="flex items-center gap-2 px-2 pb-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ShieldCheck className="h-4 w-4" /> Roles y permisos
            </Link>
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
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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
                    <input type="text" defaultValue={user?.name || ''} className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Correo Electrónico</label>
                    <input type="email" disabled defaultValue={user?.email || ''} className="w-full h-9 rounded-md border bg-muted px-3 py-1 text-sm opacity-50 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Teléfono</label>
                    <input type="tel" defaultValue={user?.phone || ''} placeholder="+54 11 1234-5678" className="w-full h-9 rounded-md border bg-background px-3 py-1 text-sm focus-visible:outline-none focus:ring-1 focus:ring-ring" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Rol Asignado</label>
                    <input type="text" disabled defaultValue={user?.role?.toUpperCase() || ''} className="w-full h-9 rounded-md border bg-muted px-3 py-1 text-sm opacity-50 cursor-not-allowed" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t bg-muted/20 py-3">
                <Button size="sm">Guardar cambios</Button>
              </CardFooter>
            </Card>

            <Card className="border-destructive/20 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base font-semibold flex items-center text-destructive"><Shield className="h-4 w-4 mr-2"/> Seguridad</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Si deseas cambiar tu contraseña, se te enviará un correo de recuperación.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="text-destructive">Restablecer contraseña</Button>
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
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'light'} onChange={() => setTheme('light')} /> Claro
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer border p-3 rounded-md transition-colors flex-1 justify-center",
                      theme === 'dark' ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}>
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'dark'} onChange={() => setTheme('dark')} /> Oscuro
                    </label>
                    <label className={cn(
                      "flex items-center gap-2 text-sm cursor-pointer border p-3 rounded-md transition-colors flex-1 justify-center",
                      theme === 'system' ? 'bg-primary/10 border-primary' : 'hover:bg-accent'
                    )}>
                      <input type="radio" name="theme" className="sr-only" checked={theme === 'system'} onChange={() => setTheme('system')} /> Sistema
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
                <CardTitle className="text-base font-semibold flex items-center"><Globe className="h-4 w-4 mr-2"/> Regional</CardTitle>
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
                    <option value="en">English</option>
                  </select>
                </div>
              </CardContent>
            </Card>
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
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="flex items-center gap-2"><Smartphone className="h-4 w-4"/> <p className="text-sm font-medium">Notificaciones Push</p></div>
                    <p className="text-xs text-muted-foreground">Notificaciones en el navegador y vista móvil al instante.</p>
                  </div>
                  <input type="checkbox" className="h-4 w-4 accent-primary" defaultChecked />
                </div>
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
        </div>
      </Tabs>
    </div>
  );
}
