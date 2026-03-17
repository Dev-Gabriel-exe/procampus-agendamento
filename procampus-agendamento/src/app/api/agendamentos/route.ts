import { NextRequest, NextResponse } from 'next/server';

// GET: lista agendamentos
// POST: criar agendamento
export async function GET(request: NextRequest) {
  return NextResponse.json({ message: 'GET agendamentos' });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ message: 'POST agendamentos' });
}
