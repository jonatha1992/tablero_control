# ADR-001: No enviar payer_email en MercadoPago preapproval

**Estado:** superseded  
**Fecha:** 2026-05-25  
**Supersedido:** 2026-05-25 — MP cambió su API y ahora `payer_email` es obligatorio (400 si se omite). `payer_email` se envía desde entonces. La restricción de cuenta sigue siendo una limitación conocida.

## Contexto

Al crear una preapproval de MercadoPago, la API permite especificar `payer_email` para pre-identificar quién va a pagar. Inicialmente se enviaba el email del admin que iniciaba el checkout.

El problema: si `payer_email` está especificado, MP restringe el pago a esa cuenta específica. Esto rompe el flujo cuando el admin que inicia el checkout es diferente a quien va a pagar, o cuando el usuario quiere pagar con otra cuenta de MP.

## Decisión

**NO enviar `payer_email`** en el body de `POST /api/mercadopago/preapproval`.

Esto permite que cualquier cuenta de MercadoPago complete el pago, sin importar cuál fue el email del admin que inició el proceso.

## Consecuencias

- Cualquier cuenta MP puede completar el checkout — más flexible para el cliente
- El endpoint `/api/mercadopago/recover` existe para casos donde el usuario necesita reintentar: cancela preapprovals pendientes y crea una nueva
- No agregar `payer_email` en futuros cambios a `preapproval.ts` sin discutir primero
