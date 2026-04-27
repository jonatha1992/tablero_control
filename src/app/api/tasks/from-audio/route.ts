import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/api/auth-helpers';
import { teamService } from '@/services/team.service';
import { transcribeAudio } from '@/lib/groq/transcribe';
import { extractTasksFromTranscription } from '@/lib/groq/extract-tasks';

export const maxDuration = 60;

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export async function POST(request: NextRequest) {
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

  const members: { id: string; name: string }[] = [];
  if (user.businessId) {
    try {
      const allMembers = await teamService.getMembersByBusiness(user.businessId);
      members.push(...allMembers.map((m) => ({ id: m.id, name: m.name })));
    } catch {
      // non-fatal
    }
  }

  const buffer = Buffer.from(await audioFile.arrayBuffer());
  let transcription: string;
  try {
    transcription = await transcribeAudio(buffer, audioFile.name || 'audio.webm');
  } catch (err) {
    console.error('[from-audio] Transcription failed', err);
    return NextResponse.json({ error: 'transcription_failed' }, { status: 502 });
  }

  let tasks: Awaited<ReturnType<typeof extractTasksFromTranscription>>;
  let parseError = false;
  try {
    tasks = await extractTasksFromTranscription(transcription, members);
  } catch (err) {
    console.error('[from-audio] Task extraction failed', err);
    tasks = [];
    parseError = true;
  }

  return NextResponse.json({ transcription, tasks, parseError });
}
