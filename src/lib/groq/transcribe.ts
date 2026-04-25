import { groq } from './client';

export async function transcribeAudio(buffer: Buffer, filename: string): Promise<string> {
  const file = new File([new Uint8Array(buffer)], filename, { type: 'audio/webm' });
  const result = await groq.audio.transcriptions.create({
    file,
    model: 'whisper-large-v3-turbo',
    language: 'es',
    response_format: 'text',
  });
  // When response_format is 'text', the SDK returns a plain string at runtime
  return result as unknown as string;
}
