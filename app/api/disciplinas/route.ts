import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
export const dynamic = 'force-dynamic'
export async function GET() {
  try {
    const subjects = await prisma.subject.findMany({ orderBy: [{ grade: 'asc' }, { name: 'asc' }] })
    return NextResponse.json(subjects)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar disciplinas' }, { status: 500 })
  }
}
