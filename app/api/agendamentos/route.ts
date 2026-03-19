// ============================================================
// ARQUIVO: app/api/agendamentos/route.ts
// CAMINHO: app/api/agendamentos/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { getGradesForRole, isGeral } from '@/lib/roles'
import { sendConfirmationToParent, sendNotificationToTeacher } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const role = (session.user as any).role ?? 'geral'

  try {
    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd   = searchParams.get('weekEnd')

    const where: any = {}
    if (weekStart && weekEnd) {
      where.date = { gte: new Date(weekStart), lte: new Date(weekEnd) }
    }

    // fund1/fund2 só veem agendamentos das suas séries
    if (!isGeral(role)) {
      where.studentGrade = { in: getGradesForRole(role) }
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: { availability: { include: { teacher: true } } },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    return NextResponse.json(appointments)
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao buscar agendamentos' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      availabilityId, date, startTime, endTime,
      parentName, parentEmail, parentPhone,
      studentName, studentGrade, reason, subjectName,
    } = body

    if (!availabilityId || !date || !startTime || !parentName || !parentEmail || !parentPhone || !studentName || !studentGrade || !reason) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const avail = await prisma.availability.findUnique({
      where: { id: availabilityId },
      include: { teacher: true },
    })
    if (!avail) return NextResponse.json({ error: 'Disponibilidade não encontrada' }, { status: 404 })

    const raw = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0]
    const [year, month, day] = raw.split('-').map(Number)
    const appointmentDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))

    const conflict = await prisma.appointment.findFirst({
      where: {
        availabilityId, startTime, status: 'confirmed',
        date: {
          gte: new Date(Date.UTC(year, month - 1, day, 0, 0, 0)),
          lt:  new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0)),
        },
      },
    })

    if (conflict) {
      return NextResponse.json({ error: 'Este horário já foi reservado. Escolha outro.' }, { status: 409 })
    }

    const appointment = await prisma.appointment.create({
      data: {
        availabilityId, date: appointmentDate,
        startTime, endTime,
        parentName, parentEmail, parentPhone,
        studentName, studentGrade,
        subjectName: subjectName || '', reason,
      },
      include: { availability: { include: { teacher: true } } },
    })

    await Promise.all([
      sendConfirmationToParent({
        parentName, parentEmail, studentName, studentGrade,
        teacherName:  avail.teacher.name,
        teacherEmail: avail.teacher.email,
        subject:   subjectName || 'Reunião Pedagógica',
        date:      appointmentDate.toISOString(),
        startTime, endTime: endTime || '', reason,
      }),
      sendNotificationToTeacher({
        parentName, parentEmail, studentName, studentGrade,
        teacherName:  avail.teacher.name,
        teacherEmail: avail.teacher.email,
        subject:   subjectName || 'Reunião Pedagógica',
        date:      appointmentDate.toISOString(),
        startTime, endTime: endTime || '', reason,
      }),
    ]).catch(console.error)

    return NextResponse.json(appointment, { status: 201 })

  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'Este horário acabou de ser reservado por outro responsável. Escolha outro.' }, { status: 409 })
    }
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}