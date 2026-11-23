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
