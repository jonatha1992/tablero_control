import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';

// Leer .env.local manualmente
const env = Object.fromEntries(
  readFileSync('E:/tablero_control/.env.local', 'utf8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

const user = env.GMAIL_USER;
const passRaw = env.GMAIL_APP_PASSWORD;
const pass = passRaw.replace(/\s/g, '');

console.log('GMAIL_USER:', user);
console.log('GMAIL_APP_PASSWORD (raw):', JSON.stringify(passRaw));
console.log('GMAIL_APP_PASSWORD (sin espacios):', JSON.stringify(pass));
console.log('Largo password:', pass.length, '(esperado: 16)');

const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: { user, pass },
});

console.log('\n→ Verificando conexión SMTP...');
try {
  await mailer.verify();
  console.log('✓ Conexión SMTP OK');
} catch (err) {
  console.error('✗ Conexión SMTP FALLÓ:', err.message);
  process.exit(1);
}

console.log('\n→ Enviando email de prueba...');
try {
  const info = await mailer.sendMail({
    from: `Tablero de Control <${user}>`,
    to: user,
    subject: '[TEST] Tarea asignada — verificación',
    html: `<p>Este es un email de prueba del sistema de notificaciones.</p>
           <p><strong>Tarea:</strong> Tarea de prueba</p>
           <p><strong>Asignado por:</strong> Sistema de test</p>
           <p>Si ves este email, el sistema funciona correctamente.</p>`,
  });
  console.log('✓ Email enviado! MessageId:', info.messageId);
  console.log('  Revisar bandeja de entrada de:', user);
} catch (err) {
  console.error('✗ Envío FALLÓ:', err.message);
  console.error('  Code:', err.code);
}
