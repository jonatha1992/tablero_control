import { NextRequest, NextResponse } from 'next/server';
import { locationService } from '@/services/location.service';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const businessId = searchParams.get('businessId');
  if (!businessId) return NextResponse.json({ error: 'businessId requerido' }, { status: 400 });

  const status = searchParams.get('status');
  const locations = status === 'active'
    ? await locationService.getActiveLocations(businessId)
    : await locationService.getByBusiness(businessId);

  return NextResponse.json(locations);
}
