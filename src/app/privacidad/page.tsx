import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de Privacidad — Tablero de Control',
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: mayo de 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Responsable del tratamiento</h2>
            <p className="text-muted-foreground leading-relaxed">
              TecnoFusión es el responsable del tratamiento de los datos personales recolectados a través de Tablero de Control. Contacto: <span className="text-foreground">tecnofusion.it@gmail.com</span>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Datos que recolectamos</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-sm mb-1">Datos de cuenta</p>
                <p className="text-muted-foreground leading-relaxed text-sm">Nombre, correo electrónico, contraseña (hasheada por Firebase), nombre del negocio, avatar, teléfono (opcional).</p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Datos de uso</p>
                <p className="text-muted-foreground leading-relaxed text-sm">Tareas, proyectos, comentarios, adjuntos, registros de tiempo, ciclos y objetivos que creás dentro del Servicio.</p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Datos técnicos</p>
                <p className="text-muted-foreground leading-relaxed text-sm">Tokens FCM (para notificaciones push), preferencias de interfaz (tema, idioma, layout), logs de auditoría internos.</p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Datos de pago</p>
                <p className="text-muted-foreground leading-relaxed text-sm">Procesados directamente por MercadoPago. No almacenamos datos de tarjetas. Solo guardamos referencias de pago (IDs de transacción).</p>
              </div>
              <div>
                <p className="font-medium text-sm mb-1">Audio (opcional)</p>
                <p className="text-muted-foreground leading-relaxed text-sm">Si usás la función de dictado de tareas, el audio se envía a Groq (servicio de transcripción). No almacenamos el audio, solo el texto transcripto.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Cómo usamos tus datos</h2>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
              <li>Prestarte el Servicio de gestión de tareas y proyectos</li>
              <li>Enviarte notificaciones push y por email relacionadas con tu trabajo</li>
              <li>Procesar pagos y emitir facturas</li>
              <li>Mejorar el Servicio mediante análisis de uso agregado (sin identificar personas)</li>
              <li>Cumplir obligaciones legales</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Terceros que procesan tus datos</h2>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Servicio</th>
                    <th className="text-left px-4 py-2 font-medium">Propósito</th>
                    <th className="text-left px-4 py-2 font-medium">Datos</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-muted-foreground">
                  <tr>
                    <td className="px-4 py-2">Firebase (Google)</td>
                    <td className="px-4 py-2">Autenticación, notificaciones push</td>
                    <td className="px-4 py-2">Email, UID, tokens FCM</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Cloudinary</td>
                    <td className="px-4 py-2">Almacenamiento de archivos</td>
                    <td className="px-4 py-2">Avatares, adjuntos de tareas</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">MercadoPago</td>
                    <td className="px-4 py-2">Procesamiento de pagos</td>
                    <td className="px-4 py-2">Datos de facturación</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Groq</td>
                    <td className="px-4 py-2">Transcripción de audio e IA</td>
                    <td className="px-4 py-2">Audio dictado, texto de tareas</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Resend / Gmail</td>
                    <td className="px-4 py-2">Envío de emails</td>
                    <td className="px-4 py-2">Email, nombre</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2">Railway</td>
                    <td className="px-4 py-2">Infraestructura del servidor</td>
                    <td className="px-4 py-2">Datos de la base de datos</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Cookies y almacenamiento local</h2>
            <div className="space-y-3">
              <p className="text-muted-foreground leading-relaxed text-sm">
                No usamos cookies de rastreo ni publicidad. El Servicio usa los siguientes mecanismos de almacenamiento:
              </p>
              <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Nombre</th>
                      <th className="text-left px-4 py-2 font-medium">Tipo</th>
                      <th className="text-left px-4 py-2 font-medium">Propósito</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-muted-foreground">
                    <tr>
                      <td className="px-4 py-2">Firebase Auth</td>
                      <td className="px-4 py-2">IndexedDB / Cookie</td>
                      <td className="px-4 py-2">Mantener sesión iniciada</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">theme</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Preferencia de tema (claro/oscuro)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">ai_panel_muted</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Preferencia de audio del asistente IA</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">tour_completed_*</td>
                      <td className="px-4 py-2">localStorage</td>
                      <td className="px-4 py-2">Registro de tour de onboarding completado</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-muted-foreground text-sm">
                Podés borrar estos datos desde la configuración de tu navegador en cualquier momento.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Notificaciones push</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Las notificaciones push son opcionales. Si las activás, se genera un token de dispositivo único que se almacena en nuestra base de datos para enviarte alertas. Podés desactivarlas desde la configuración del navegador o desde Configuración → Notificaciones en el dashboard. Los tokens de dispositivos no activos se eliminan automáticamente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Retención de datos</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Los datos se conservan mientras tu cuenta esté activa. Al eliminar tu cuenta, los datos se borran en un plazo de 30 días, salvo que debamos conservarlos por obligaciones legales o fiscales. Los logs de auditoría se conservan 12 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Tus derechos</h2>
            <p className="text-muted-foreground leading-relaxed text-sm mb-3">
              De acuerdo con la Ley 25.326 de Protección de Datos Personales de Argentina, tenés derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground text-sm">
              <li><span className="text-foreground font-medium">Acceso:</span> solicitar qué datos tenemos sobre vos</li>
              <li><span className="text-foreground font-medium">Rectificación:</span> corregir datos inexactos</li>
              <li><span className="text-foreground font-medium">Supresión:</span> solicitar la eliminación de tus datos</li>
              <li><span className="text-foreground font-medium">Oposición:</span> oponerte al tratamiento en determinadas circunstancias</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed text-sm mt-3">
              Para ejercer estos derechos escribí a <span className="text-foreground">tecnofusion.it@gmail.com</span>. Respondemos en un plazo de 30 días hábiles.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Seguridad</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Implementamos medidas de seguridad técnicas y organizativas: autenticación Firebase, comunicación cifrada (HTTPS/TLS), separación de datos por negocio (multi-tenant), control de acceso por roles y logs de auditoría de todas las operaciones críticas.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Cambios a esta política</h2>
            <p className="text-muted-foreground leading-relaxed text-sm">
              Podemos actualizar esta política. Los cambios significativos se notificarán por email. La fecha de última actualización indica la versión vigente.
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t flex gap-4 text-sm text-muted-foreground">
          <Link href="/terminos" className="hover:text-foreground transition-colors">Términos y Condiciones</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
