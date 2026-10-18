import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/booking/service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = verifyOtp(body);
    return NextResponse.json(result.data, { status: result.status });
  } catch {
    return NextResponse.json({ error: 'INVALID_REQUEST' }, { status: 400 });
  }
}
