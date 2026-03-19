// app/api/disciplinas/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const gradeFilter = searchParams.get('grade')

    // Tenta pegar o role da sessão (pode ser chamado sem auth pelo agendamento público)
    let roleGrades: string[] = []
    try {
      const session = await auth()
      const role = (session?.user as any)?.role
      if (role && !isGeral(role)) {
        roleGrades = getGradesForRole(role)
      }
    } catch { /* rota pública — sem filtro de role */ }

    const where: any = {}
    if (gradeFilter) where.grade = gradeFilter
    if (roleGrades.length > 0) where.grade = { in: roleGrades }

    const subjects = await prisma.subject.findMany({
      where,
      orderBy: [{ grade: 'asc' }, { name: 'asc' }],
    })
    return NextResponse.json(subjects)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar disciplinas' }, { status: 500 })
  }
}