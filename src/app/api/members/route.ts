import { NextRequest, NextResponse } from 'next/server';
import { teamService } from '@/services/team.service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  const members = await teamService.getMembersByBusiness(businessId);
  return NextResponse.json(members);
}

export async function POST(request: NextRequest) {
  const { dto, businessId } = await request.json();
  const member = await teamService.inviteMember(dto, businessId);
  return NextResponse.json(member, { status: 201 });
}
