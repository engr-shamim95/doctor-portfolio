import { NextResponse } from 'next/server';
import { getAvailability } from '@/lib/booking/service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const chamberId = searchParams.get('chamberId') || '';
  const date = searchParams.get('date') || '';

  if (!chamberId || !date) {
    return NextResponse.json({ error: 'chamberId and date are required' }, { status: 400 });
  }

  const result = getAvailability(chamberId, date);
  return NextResponse.json(result.data, { status: result.status });
}
