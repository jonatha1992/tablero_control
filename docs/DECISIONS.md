# Decisiones — tablero_control

Registro de decisiones del repo (se actualiza en cada `promote-to-test`).

Formato por entrada: `## YYYY-MM-DD — título` con Contexto, Decisión, Alternativas descartadas, Motivo, Impacto, Ticket/commit.

---

## 2026-11-23 — Migración de correos transaccionales a correo-central

- **Contexto:** `MailService` enviaba los 9 tipos de correo usando Resend propio (`src/lib/resend.ts`) con fallback Gmail SMTP (`src/lib/gmail.ts` + `nodemailer`) y 9 plantillas React Email.
- **Decisión:** Reemplazar el transporte y plantillas locales por el cliente HTTP `src/lib/correo-central.ts` (`fetch` con `AbortController`) apuntando a `https://correo.tecnofusion.dev/v1/send` con plantillas centrales (`bienvenida`, `pago-recibido`, `aviso`). Eliminar `resend`, `nodemailer`, `@types/nodemailer` y `@react-email/*`.
- **Alternativas descartadas:** Mantener React Email enviando HTML crudo; mantener Resend/Gmail por app.
- **Motivo:** Centralizar dominio verificado (`avisos@tecnofusion.dev`), cuota, reintentos automáticos (`202 queued`), supresión de rebotes y branding en un único servicio.
- **Impacto:** `src/lib/correo-central.ts`, `src/services/mail.service.ts`, `.env.example`, `deploy/.env.example`, `package.json`, `src/test/service-mail.test.ts`.

## 2026-11-23 — Build Docker reproducible sin Git

- **Contexto:** El evento 613 falló por `npm ci` con `read ETIMEDOUT`. Además, el prebuild incorporado en `fd5a727` ejecutaba Git aunque la imagen Alpine no lo incluye y `.dockerignore` excluye `.git`.
- **Decisión:** Reutilizar `GIT_SHA` que ya inyecta el desplegador, pasarlo mediante Compose al build y generar los metadatos sin incrementar nuevamente la versión de la release. Mantener Git como fuente para builds locales. Aumentar a cinco los reintentos acotados de npm.
- **Alternativas descartadas:** Instalar Git y copiar su historial a la imagen; publicar manualmente fuera del desplegador; ocultar errores de npm.
- **Motivo:** El build debe usar el SHA realmente construido y tolerar fallos transitorios de red sin cambiar la versión por cada reconstrucción.
- **Impacto:** Dockerfile, ambos Compose, script de versión y prueba de regresión sin Git. Versión 0.1.43.
- **Ticket/commit:** Control Apps, tarea 39185; antecedente `5ef7b01`.
