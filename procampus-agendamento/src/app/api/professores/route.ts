import { NextRequest, NextResponse } from 'next/server';

// GET: lista professores
// POST: criar professor
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET professores' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'POST professores' });
}
