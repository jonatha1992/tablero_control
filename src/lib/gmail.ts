import nodemailer from 'nodemailer';

if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
  console.warn('GMAIL_USER o GMAIL_APP_PASSWORD no están configuradas. Los correos no se enviarán.');
}

export const mailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER ?? '',
    pass: (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s/g, ''),
  },
});
