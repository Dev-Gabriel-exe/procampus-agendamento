// app/api/agendamentos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendCancellationToParent } from '@/lib/email'
import { getGradesForRole, isGeral } from '@/lib/roles'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  let body: { status?: unknown; cancellationReason?: unknown }
  try {
    body = await req.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid body')
  } catch {
    return NextResponse.json({ error: 'Envie os dados do cancelamento.' }, { status: 400 })
  }
  if (body.status !== 'cancelled') {
    return NextResponse.json({ error: 'Esta ação permite apenas cancelar um agendamento.' }, { status: 400 })
  }
  if (body.cancellationReason != null && typeof body.cancellationReason !== 'string') {
    return NextResponse.json({ error: 'O motivo deve ser um texto.' }, { status: 400 })
  }
  const cancellationReason = typeof body.cancellationReason === 'string' ? body.cancellationReason.trim() || null : null
  if (cancellationReason && cancellationReason.length > 500) {
    return NextResponse.json({ error: 'O motivo deve ter no máximo 500 caracteres.' }, { status: 400 })
  }

  try {
    const appt = await prisma.appointment.findUnique({
      where: { id: params.id },
      include: { availability: { include: { teacher: true } } },
    })
    if (!appt) return NextResponse.json({ error: 'Agendamento não encontrado.' }, { status: 404 })
    const role = (session.user as any)?.role ?? ''
    // Mesmo escopo de séries da listagem da secretaria, inclusive quando o professor foi escolhido errado.
    if (!isGeral(role) && !getGradesForRole(role).includes(appt.studentGrade)) {
      return NextResponse.json({ error: 'Agendamento fora do seu nível de acesso.' }, { status: 403 })
    }
    // A atualização condicional evita dois cancelamentos/e-mails em cliques ou requisições simultâneos.
    const result = await prisma.appointment.updateMany({
      where: { id: params.id, status: 'confirmed' },
      data: { status: 'cancelled', cancellationReason },
    })
    if (!result.count) {
      return NextResponse.json({ error: 'Este agendamento já foi cancelado ou alterado. Atualize a lista.' }, { status: 409 })
    }

    let notificationSent = false
    try {
      notificationSent = await sendCancellationToParent({
        parentName: appt.parentName,
        parentEmail: appt.parentEmail,
        studentName: appt.studentName,
        studentGrade: appt.studentGrade,
        teacherName: appt.availability.teacher.name,
        subject: appt.subjectName || 'Reunião Pedagógica',
        date: appt.date.toISOString(),
        startTime: appt.startTime,
        cancellationReason: cancellationReason ?? undefined,
      }) === true
    } catch (error) {
      // O cancelamento já foi salvo: uma falha no e-mail não pode ser apresentada como falha da gravação.
      console.error('Erro ao enviar aviso de cancelamento:', error)
    }
    return NextResponse.json({ ...appt, status: 'cancelled', cancellationReason, notificationSent })
  } catch (error) {
    console.error('Erro ao cancelar agendamento:', error)
    const missingMigration = ['P2021', 'P2022'].includes((error as { code?: string })?.code ?? '')
    return NextResponse.json({ error: missingMigration
      ? 'A atualização do cancelamento ainda não foi aplicada ao banco. Avise o administrador.'
      : 'Não foi possível cancelar o agendamento. Tente novamente.' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const appt = await prisma.appointment.findUnique({ where: { id: params.id } })
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const isPast      = new Date(appt.date) < new Date()
  const isCancelled = appt.status === 'cancelled'

  if (!isPast && !isCancelled) {
    return NextResponse.json(
      { error: 'Só é possível apagar agendamentos cancelados ou já realizados.' },
      { status: 403 }
    )
  }

  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}