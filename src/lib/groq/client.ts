import Groq from 'groq-sdk';

if (!process.env.GROQ_API_KEY) {
  console.warn('GROQ_API_KEY no está configurada. La transcripción de audio no funcionará.');
}

const globalForGroq = globalThis as unknown as { groq: Groq };

export const groq = globalForGroq.groq ?? new Groq({ apiKey: process.env.GROQ_API_KEY ?? 'no-key' });

if (process.env.NODE_ENV !== 'production') globalForGroq.groq = groq;
