import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { transcribeAudio } from '@/lib/groq/transcribe';
import { handle } from '@/lib/api/route-handler';

export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export const POST = handle(async (request: NextRequest) => {
  const user = await requireUser(request);
  if (user instanceof NextResponse) return user;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'invalid_form_data' }, { status: 400 });
  }

  const audioFile = formData.get('audio') as File | null;
  if (!audioFile) {
    return NextResponse.json({ error: 'audio_required' }, { status: 400 });
  }

  if (audioFile.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: 'file_too_large' }, { status: 413 });
  }

  const buffer = Buffer.from(await audioFile.arrayBuffer());
  let text: string;
  try {
    text = await transcribeAudio(buffer, audioFile.name || 'audio.webm');
  } catch (err) {
    console.error('[assistant/transcribe] Transcription failed', err);
    return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
  }

  return NextResponse.json({ text });
});
