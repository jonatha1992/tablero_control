import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await request.json();
  const member = await teamService.updateMember(id, data);
  return NextResponse.json(member);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await teamService.removeMember(id);
  return NextResponse.json({ ok: true });
}
