import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getSelectableGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

// Não depende da tabela ScheduleBlock, nem carrega agendamentos dos professores.
export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Sua sessão expirou. Entre novamente.' }, { status: 401 })
  const role = (session.user as { role?: string }).role ?? 'geral'
  const grades = getSelectableGradesForRole(role)
  if (!grades.length) return NextResponse.json({ error: 'Acesso não autorizado.' }, { status: 403 })
  try {
    const teachers = await prisma.teacher.findMany({
      where: isGeral(role) ? {} : { role },
      select: { id: true, name: true, subjects: { select: { subject: { select: { grade: true } } } } },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ grades, teachers: teachers.map(teacher => ({
      id: teacher.id, name: teacher.name,
      grades: grades.filter(grade => teacher.subjects.some(item => item.subject.grade === grade)),
    })) })
  } catch (error) {
    console.error('Opções de bloqueio indisponíveis', error)
    // Séries continuam disponíveis mesmo que a consulta de professores falhe.
    return NextResponse.json({ grades, teachers: [], error: 'Não foi possível carregar os professores. Tente novamente.' }, { status: 503 })
  }
}
