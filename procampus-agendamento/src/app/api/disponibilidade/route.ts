import { NextRequest, NextResponse } from 'next/server';

// GET: slots livres por série + disciplina
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET disponibilidade' });
}
