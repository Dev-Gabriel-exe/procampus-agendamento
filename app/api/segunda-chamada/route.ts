// app/api/segunda-chamada/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

const GRADES_FUND1 = ['Educação Infantil','1º Ano Fundamental','2º Ano Fundamental','3º Ano Fundamental','4º Ano Fundamental','5º Ano Fundamental']

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isPublic    = searchParams.get('public') === 'true'
  const grade       = searchParams.get('grade')
  const subjectName = searchParams.get('subject')
  const turno       = searchParams.get('turno') // 'manha' | 'tarde' | null

  if (isPublic) {
    try {
      const now = new Date()
      const where: any = {
        active: true,
        date: { gte: now },
        // Slot só aparece se não tem prazo OU se o prazo ainda não venceu
        OR: [
          { registrationDeadline: null },
          { registrationDeadline: { gte: now } },
        ],
      }
      if (grade)       where.grade       = grade
      if (subjectName) where.subjectName = subjectName

      const exams = await prisma.examSchedule.findMany({
        where,
        include: { bookings: { select: { id: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })

      // Filtra por turno (startTime é string "HH:MM", comparação lexicográfica funciona)
      const filtered = turno
        ? exams.filter(e => turno === 'manha' ? e.startTime >= '12:00' : e.startTime < '12:00')
        : exams

      return NextResponse.json(filtered)
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Erro ao buscar provas' }, { status: 500 })
    }
  }

  // Rota privada: secretaria
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const role = (session.user as any)?.role ?? 'geral'

  try {
    const where: any = { active: true }
    if (!isGeral(role)) {
      const allowedGrades = getGradesForRole(role)
      where.grade = { in: allowedGrades }
    }
    if (grade)       where.grade       = grade
    if (subjectName) where.subjectName = subjectName

    const exams = await prisma.examSchedule.findMany({
      where,
      include: { bookings: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return NextResponse.json(exams)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar provas' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const role = (session.user as any)?.role ?? 'geral'

  try {
    const {
      subjectId,
      subjectName,
      grade,
      date,
      startTime,
      endTime,
      registrationDeadline, // novo: prazo de inscrições (opcional)
    } = await req.json()

    if (!subjectId || !subjectName || !grade || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'O horário de fim deve ser após o início.' }, { status: 400 })
    }
    if (!isGeral(role)) {
      const allowed = getGradesForRole(role)
      if (!allowed.includes(grade)) {
        return NextResponse.json({ error: 'Série fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    // Normaliza data da prova para meio-dia UTC
    const rawDate = date.split('T')[0]
    const [year, month, day] = rawDate.split('-').map(Number)
    const examDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

    // Processa registrationDeadline (se fornecido)
    let deadline: Date | null = null
    if (registrationDeadline) {
      const rawDeadline = registrationDeadline.split('T')[0]
      const [dy, dm, dd] = rawDeadline.split('-').map(Number)
      // Fim do dia anterior em Fortaleza = próximo dia às 03:00 UTC
      deadline = new Date(Date.UTC(dy, dm - 1, dd + 1, 3, 0, 0, 0))
    }

    // Verifica se já existe (mesma disciplina, série, data, horário)
    const existing = await prisma.examSchedule.findFirst({
      where: { subjectId, grade, date: examDate, startTime, endTime, active: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Este slot já existe para esta disciplina.' }, { status: 409 })
    }

    const exam = await prisma.examSchedule.create({
      data: {
        subjectId,
        subjectName,
        grade,
        date: examDate,
        startTime,
        endTime,
        role,
        registrationDeadline: deadline,
      },
      include: { bookings: true },
    })

    return NextResponse.json(exam, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}