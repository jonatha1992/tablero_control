import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos y Condiciones — Tablero de Control',
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
        <p className="text-sm text-muted-foreground mb-10">Última actualización: mayo de 2025</p>

        <div className="prose prose-sm max-w-none space-y-8 text-foreground">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Aceptación</h2>
            <p className="text-muted-foreground leading-relaxed">
              Al acceder o usar Tablero de Control (el &quot;Servicio&quot;), operado por TecnoFusión, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo, no uses el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Descripción del servicio</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tablero de Control es una plataforma SaaS de gestión de tareas y proyectos multi-tenant. Permite a negocios organizar equipos, ciclos de trabajo, objetivos y tareas. El Servicio incluye funciones de inteligencia artificial (transcripción de audio, extracción de tareas, asistente conversacional) y notificaciones push.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Registro y cuenta</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para usar el Servicio debés crear una cuenta con información verídica. Sos responsable de mantener la confidencialidad de tus credenciales y de todas las actividades que ocurran bajo tu cuenta. Debés notificarnos inmediatamente ante cualquier uso no autorizado.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Planes y facturación</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              El Servicio ofrece planes gratuitos y pagos. Los planes pagos se facturan de forma mensual o anual a través de MercadoPago. Los precios están expresados en pesos argentinos (ARS) y pueden modificarse con 30 días de anticipación.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Los pagos son no reembolsables salvo que la ley argentina lo exija. Las suscripciones se renuevan automáticamente salvo cancelación previa al período siguiente. En caso de falta de pago, el acceso puede limitarse o suspenderse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Uso aceptable</h2>
            <p className="text-muted-foreground leading-relaxed mb-2">Queda prohibido:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Usar el Servicio para actividades ilegales o que violen derechos de terceros</li>
              <li>Intentar acceder a datos de otros negocios o usuarios sin autorización</li>
              <li>Hacer ingeniería inversa, descompilar o copiar el Servicio</li>
              <li>Enviar spam, malware o contenido dañino a través del Servicio</li>
              <li>Sobrecargar la infraestructura mediante abuso de la API o automatizaciones maliciosas</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Propiedad intelectual</h2>
            <p className="text-muted-foreground leading-relaxed">
              El Servicio y su contenido (código, diseño, marca) son propiedad de TecnoFusión. El usuario conserva la propiedad de los datos y contenidos que sube al Servicio. Al hacerlo, otorgás una licencia limitada para procesarlos con el fin de prestar el Servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Disponibilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              Nos esforzamos por mantener el Servicio disponible, pero no garantizamos disponibilidad ininterrumpida. Podemos realizar mantenimiento, actualizaciones o interrupciones necesarias sin previo aviso. No somos responsables por pérdidas derivadas de interrupciones del servicio.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Limitación de responsabilidad</h2>
            <p className="text-muted-foreground leading-relaxed">
              En la máxima medida permitida por la ley, TecnoFusión no será responsable por daños indirectos, incidentales, especiales o consecuentes derivados del uso o la imposibilidad de usar el Servicio. Nuestra responsabilidad total no superará el monto pagado en los últimos 3 meses.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Cancelación y terminación</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podés cancelar tu cuenta en cualquier momento desde la sección de facturación. TecnoFusión puede suspender o terminar cuentas que violen estos Términos. Tras la cancelación, los datos se conservan 30 días y luego se eliminan permanentemente.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Modificaciones</h2>
            <p className="text-muted-foreground leading-relaxed">
              Podemos modificar estos Términos en cualquier momento. Los cambios significativos se notificarán por email con al menos 15 días de anticipación. El uso continuado del Servicio después de esa fecha implica aceptación de los nuevos Términos.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Ley aplicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa se someterá a los tribunales ordinarios competentes de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contacto</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para consultas sobre estos Términos: <span className="text-foreground">tecnofusion.it@gmail.com</span>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t flex gap-4 text-sm text-muted-foreground">
          <Link href="/privacidad" className="hover:text-foreground transition-colors">Política de Privacidad</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Iniciar sesión</Link>
        </div>
      </div>
    </div>
  );
}
