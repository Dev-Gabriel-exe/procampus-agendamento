// app/api/recuperacao/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const isPublic = searchParams.get('public') === 'true'
  const grade    = searchParams.get('grade')
  const type     = searchParams.get('type')
  const subject  = searchParams.get('subject')

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
      if (grade)   where.grade = grade
      if (type)    where.type  = type
      if (subject) where.subjectName = subject

      const schedules = await prisma.recoverySchedule.findMany({
        where,
        include: { bookings: { where: { status: 'PENDING' }, select: { id: true } } },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      })
      return NextResponse.json(schedules)
    } catch (e) {
      console.error(e)
      return NextResponse.json({ error: 'Erro ao buscar recuperações' }, { status: 500 })
    }
  }

  // Secretaria — sem filtro de prazo, mostra tudo
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const role = (session.user as any)?.role ?? 'geral'

  try {
    const where: any = { active: true }
    if (!isGeral(role)) {
      const allowed = getGradesForRole(role)
      where.grade = { in: allowed }
    }
    if (grade)   where.grade = grade
    if (type)    where.type  = type
    if (subject) where.subjectName = subject

    const schedules = await prisma.recoverySchedule.findMany({
      where,
      include: { bookings: { orderBy: { createdAt: 'asc' } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })
    return NextResponse.json(schedules)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao buscar recuperações' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const role = (session.user as any)?.role ?? 'geral'

  try {
    const {
      subjectId, subjectName, grade, type, period,
      date, startTime, endTime,
      registrationDeadline,   // ← novo campo (opcional)
    } = await req.json()

    if (!subjectId || !subjectName || !grade || !type || !date || !startTime || !endTime) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }
    if (startTime >= endTime) {
      return NextResponse.json({ error: 'Horário de fim deve ser após o início.' }, { status: 400 })
    }
    if (!isGeral(role)) {
      const allowed = getGradesForRole(role)
      if (!allowed.includes(grade)) {
        return NextResponse.json({ error: 'Série fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    // Normaliza data da prova para meio-dia UTC (evita drift de fuso)
    const rawDate = date.split('T')[0]
    const [year, month, day] = rawDate.split('-').map(Number)
    const scheduleDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

    // Normaliza prazo (se informado) para fim do dia no UTC-3 → 03:00 UTC do dia seguinte
    let deadlineDate: Date | null = null
    if (registrationDeadline) {
      const [dy, dm, dd] = registrationDeadline.split('T')[0].split('-').map(Number)
      // Fim do dia = 23:59 no horário de Fortaleza (UTC-3) = 02:59 UTC do dia seguinte
      // Usamos 03:00 UTC do dia seguinte como proxy seguro
      deadlineDate = new Date(Date.UTC(dy, dm - 1, dd + 1, 3, 0, 0, 0))
    }

    // Valida: prazo deve ser anterior à data da prova
    if (deadlineDate && deadlineDate >= scheduleDate) {
      return NextResponse.json(
        { error: 'O prazo de inscrições deve ser anterior à data da prova.' },
        { status: 400 }
      )
    }

    const existing = await prisma.recoverySchedule.findFirst({
      where: { subjectId, grade, type, date: scheduleDate, startTime, endTime, active: true },
    })
    if (existing) {
      return NextResponse.json({ error: 'Este slot já existe.' }, { status: 409 })
    }

    const schedule = await prisma.recoverySchedule.create({
      data: {
        subjectId, subjectName, grade, type,
        period: period ?? null,
        date: scheduleDate,
        startTime, endTime,
        role,
        registrationDeadline: deadlineDate,   // null se não informado
      },
      include: { bookings: true },
    })
    return NextResponse.json(schedule, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar slot' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await prisma.recoveryBooking.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao remover inscrição' }, { status: 500 })
  }
}