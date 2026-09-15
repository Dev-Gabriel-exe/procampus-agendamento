import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isGeral } from '@/lib/roles'
import { appointmentStartUtc, parseDateInput } from '@/lib/schedule-blocks'
import { sendCancellationToParent } from '@/lib/email'

export const dynamic = 'force-dynamic'

function todayInFortaleza(): Date {
  const local = new Date(Date.now() - 3 * 60 * 60 * 1000)
  return new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate(), 12, 0, 0, 0))
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    const blocks = await prisma.scheduleBlock.findMany({
      where: { endDate: { gte: todayInFortaleza() } },
      include: { teacher: { select: { id: true, name: true, role: true } } },
      orderBy: [{ startDate: 'asc' }, { createdAt: 'asc' }],
    })

    const visible = blocks
      .filter(block => isGeral(role) || block.role === 'geral' || block.role === role || block.teacher?.role === role)
      .map(block => ({
        ...block,
        canDelete: isGeral(role) || (block.role === role && (!block.teacher || block.teacher.role === role)),
      }))

    return NextResponse.json(visible)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao buscar bloqueios' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    const body = await req.json()
    const startDate = parseDateInput(String(body.startDate ?? ''))
    const endDate = parseDateInput(String(body.endDate ?? body.startDate ?? ''))
    const teacherId = typeof body.teacherId === 'string' && body.teacherId.trim()
      ? body.teacherId.trim()
      : null
    const reason = typeof body.reason === 'string' ? body.reason.trim() : ''

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'Informe datas válidas.' }, { status: 400 })
    }
    if (endDate < startDate) {
      return NextResponse.json({ error: 'A data final não pode ser anterior à data inicial.' }, { status: 400 })
    }
    if (endDate < todayInFortaleza()) {
      return NextResponse.json({ error: 'Não é possível criar um bloqueio totalmente no passado.' }, { status: 400 })
    }
    if (reason.length < 3 || reason.length > 240) {
      return NextResponse.json({ error: 'O motivo deve ter entre 3 e 240 caracteres.' }, { status: 400 })
    }

    let selectedTeacher: { id: string; name: string; role: string } | null = null
    if (teacherId) {
      selectedTeacher = await prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { id: true, name: true, role: true },
      })
      if (!selectedTeacher) {
        return NextResponse.json({ error: 'Professor não encontrado.' }, { status: 404 })
      }
      if (!isGeral(role) && selectedTeacher.role !== role) {
        return NextResponse.json({ error: 'Professor fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    const duplicate = await prisma.scheduleBlock.findFirst({
      where: { startDate, endDate, teacherId, role, reason },
      select: { id: true },
    })
    if (duplicate) {
      return NextResponse.json({ error: 'Este bloqueio já foi cadastrado.' }, { status: 409 })
    }

    const candidates = await prisma.appointment.findMany({
      where: {
        status: 'confirmed',
        date: { gte: startDate, lte: endDate },
      },
      include: { availability: { include: { teacher: true } } },
    })

    const now = new Date()
    const appointmentsToCancel = candidates.filter(appointment => {
      const teacher = appointment.availability.teacher
      const matchesScope = teacherId
        ? teacher.id === teacherId
        : isGeral(role) || teacher.role === role
      return matchesScope && appointmentStartUtc(appointment.date, appointment.startTime) > now
    })
    const appointmentIds = appointmentsToCancel.map(appointment => appointment.id)

    const [block] = await prisma.$transaction([
      prisma.scheduleBlock.create({
        data: { startDate, endDate, reason, teacherId, role },
        include: { teacher: { select: { id: true, name: true, role: true } } },
      }),
      prisma.appointment.updateMany({
        where: { id: { in: appointmentIds }, status: 'confirmed' },
        data: { status: 'cancelled' },
      }),
    ])

    const notificationResults = await Promise.all(appointmentsToCancel.map(appointment => sendCancellationToParent({
      parentName: appointment.parentName,
      parentEmail: appointment.parentEmail,
      studentName: appointment.studentName,
      studentGrade: appointment.studentGrade,
      teacherName: appointment.availability.teacher.name,
      subject: appointment.subjectName || 'Reunião Pedagógica',
      date: appointment.date.toISOString(),
      startTime: appointment.startTime,
      cancellationReason: reason,
    })))
    const notifiedCount = notificationResults.filter(Boolean).length

    return NextResponse.json({
      block: { ...block, canDelete: true },
      cancelledCount: appointmentsToCancel.length,
      notifiedCount,
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao criar bloqueio' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 })

  try {
    const block = await prisma.scheduleBlock.findUnique({
      where: { id },
      include: { teacher: { select: { role: true } } },
    })
    if (!block) return NextResponse.json({ error: 'Bloqueio não encontrado.' }, { status: 404 })

    const canDelete = isGeral(role) || (block.role === role && (!block.teacher || block.teacher.role === role))
    if (!canDelete) return NextResponse.json({ error: 'Sem permissão para remover este bloqueio.' }, { status: 403 })

    await prisma.scheduleBlock.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erro ao remover bloqueio' }, { status: 500 })
  }
}
