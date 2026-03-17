import { NextRequest, NextResponse } from 'next/server';

// POST: criar disponibilidade do professor
export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'POST disponibilidade-prof' });
}
