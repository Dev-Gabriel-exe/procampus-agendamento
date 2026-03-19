// app/api/professores/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any).role ?? 'geral'

  try {
    const teachers = await prisma.teacher.findMany({
      // fund1/fund2 só veem professores criados pelo mesmo role
      where: isGeral(role) ? {} : { role },
      include: {
        subjects:       { include: { subject: true } },
        availabilities: { include: { appointments: { select: { id: true, date: true, startTime: true } } } },
      },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(teachers)
  } catch {
    return NextResponse.json({ error: 'Erro ao buscar professores' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any).role ?? 'geral'

  try {
    const { name, email, phone, subjectIds } = await req.json()
    if (!name || !email || !phone)
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })

    // Valida que as disciplinas pertencem às séries permitidas para o role
    if (!isGeral(role) && subjectIds?.length) {
      const allowedGrades = getGradesForRole(role)
      const subjects = await prisma.subject.findMany({ where: { id: { in: subjectIds } } })
      const hasInvalidSubject = subjects.some(s => !allowedGrades.includes(s.grade))
      if (hasInvalidSubject) {
        return NextResponse.json(
          { error: 'Disciplina fora do seu nível de acesso.' },
          { status: 403 }
        )
      }
    }

    const teacher = await prisma.teacher.create({
      data: {
        name, email, phone,
        role, // salva qual secretaria criou
        subjects: { create: subjectIds?.map((id: string) => ({ subjectId: id })) ?? [] },
      },
      include: { subjects: { include: { subject: true } } },
    })
    return NextResponse.json(teacher, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro ao criar professor' }, { status: 500 })
  }
}