// app/api/agendamentos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendCancellationToParent } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status } = await req.json()

  const appt = await prisma.appointment.update({
    where: { id: params.id },
    data:  { status },
    include: { availability: { include: { teacher: true } } },
  })

  if (status === 'cancelled') {
    sendCancellationToParent({
      parentName:   appt.parentName,
      parentEmail:  appt.parentEmail,
      studentName:  appt.studentName,
      studentGrade: appt.studentGrade,
      teacherName:  appt.availability.teacher.name,
      subject:      (appt as any).subjectName || 'Reunião Pedagógica',
      date:         appt.date.toISOString(),
      startTime:    appt.startTime,
    }).catch(console.error)
  }

  return NextResponse.json(appt)
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