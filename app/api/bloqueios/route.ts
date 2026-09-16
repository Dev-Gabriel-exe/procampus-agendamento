import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { isGeral } from '@/lib/roles'
import { BlockInputError, blockStorageError, parseBlockSelection } from '@/lib/block-selection'
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
    return NextResponse.json({ error: blockStorageError(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any)?.role ?? 'geral'

  try {
    const body = await req.json()
    const { teacherIds, grades } = parseBlockSelection(body, role)
    const startDate = parseDateInput(String(body.startDate ?? ''))
    const endDate = parseDateInput(String(body.endDate ?? body.startDate ?? ''))
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

    if (teacherIds.length) {
      const selectedTeachers = await prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, name: true, role: true },
      })
      if (selectedTeachers.length !== teacherIds.length) {
        return NextResponse.json({ error: 'Um dos professores não existe mais. Atualize a lista.' }, { status: 400 })
      }
      if (!isGeral(role) && selectedTeachers.some(teacher => teacher.role !== role)) {
        return NextResponse.json({ error: 'Professor fora do seu nível de acesso.' }, { status: 403 })
      }
    }

    // Um registro por professor, na mesma transação: sem nova tabela e sem gravação parcial.
    const targets: (string | null)[] = teacherIds.length ? teacherIds : [null]
    const { blocks, appointmentsToCancel } = await prisma.$transaction(async tx => {
      const blocks = []
      for (const teacherId of targets) {
        const duplicate = await tx.scheduleBlock.findFirst({
          where: { startDate, endDate, teacherId, role, reason, grades: { equals: grades } },
        })
        if (duplicate) continue
        blocks.push(await tx.scheduleBlock.create({
          data: { startDate, endDate, reason, teacherId, role, grades },
          include: { teacher: { select: { id: true, name: true, role: true } } },
        }))
      }
      if (!blocks.length) throw new BlockInputError('Os bloqueios selecionados já estão cadastrados.', 409)
      const candidates = await tx.appointment.findMany({
        where: {
          status: 'confirmed', date: { gte: startDate, lte: endDate },
          ...(grades.length ? { studentGrade: { in: grades } } : {}),
          availability: { teacher: teacherIds.length ? { id: { in: teacherIds } } : isGeral(role) ? {} : { role } },
        },
        include: { availability: { include: { teacher: true } } },
      })
      const now = new Date()
      const appointmentsToCancel = candidates.filter(appointment => appointmentStartUtc(appointment.date, appointment.startTime) > now)
      await tx.appointment.updateMany({
        where: { id: { in: appointmentsToCancel.map(appointment => appointment.id) }, status: 'confirmed' },
        data: { status: 'cancelled' },
      })
      return { blocks, appointmentsToCancel }
    }, { isolationLevel: 'Serializable', timeout: 20000 })

    const notificationResults = await Promise.allSettled(appointmentsToCancel.map(appointment => sendCancellationToParent({
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
    const notifiedCount = notificationResults.filter(result => result.status === 'fulfilled' && result.value).length

    return NextResponse.json({
      block: { ...blocks[0], canDelete: true },
      blocks: blocks.map(block => ({ ...block, canDelete: true })),
      createdCount: blocks.length,
      cancelledCount: appointmentsToCancel.length,
      notifiedCount,
    }, { status: 201 })
  } catch (error) {
    if (error instanceof BlockInputError) return NextResponse.json({ error: error.message }, { status: error.status })
    if ((error as { code?: string })?.code === 'P2034') return NextResponse.json({ error: 'O calendário foi alterado ao mesmo tempo. Atualize e tente novamente.' }, { status: 409 })
    console.error(error)
    return NextResponse.json({ error: blockStorageError(error) }, { status: 500 })
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
