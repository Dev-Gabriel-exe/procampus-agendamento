// ============================================================
// ARQUIVO: src/app/api/agendamentos/route.ts
// CAMINHO: procampus-agendamento/src/app/api/agendamentos/route.ts
// SUBSTITUA o arquivo inteiro
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { sendConfirmationToParent, sendNotificationToTeacher } from '@/lib/email'
export const dynamic = 'force-dynamic'
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const weekStart = searchParams.get('weekStart')
    const weekEnd   = searchParams.get('weekEnd')

    const appointments = await prisma.appointment.findMany({
      where: weekStart && weekEnd ? {
        date: { gte: new Date(weekStart), lte: new Date(weekEnd) },
      } : {},
      include: {
        availability: { include: { teacher: true } },
      },
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

    // Normaliza a data para meia-noite UTC — resolve problema de fuso horário (Brasília UTC-3)
    const appointmentDate = new Date(date)
    appointmentDate.setUTCHours(0, 0, 0, 0)

    // Verifica conflito usando range de 24h (mais robusto que comparar datetime exato)
    const conflict = await prisma.appointment.findFirst({
      where: {
        availabilityId,
        startTime,
        status: 'confirmed',
        date: {
          gte: new Date(appointmentDate.getTime()),
          lt:  new Date(appointmentDate.getTime() + 24 * 60 * 60 * 1000),
        },
      },
    })

    if (conflict) {
      return NextResponse.json(
        { error: 'Este horário já foi reservado. Escolha outro.' },
        { status: 409 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        availabilityId,
        date:      appointmentDate,
        startTime,
        endTime,
        parentName, parentEmail, parentPhone,
        studentName, studentGrade, subjectName: subjectName || '', reason,
      },
      include: { availability: { include: { teacher: true } } },
    })

    // E-mails em paralelo (não bloqueia a resposta)
    Promise.all([
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
    // P2002 = unique constraint violada — dois usuários tentaram o mesmo slot ao mesmo tempo
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Este horário acabou de ser reservado por outro responsável. Escolha outro.' },
        { status: 409 }
      )
    }
    console.error(e)
    return NextResponse.json({ error: 'Erro ao criar agendamento' }, { status: 500 })
  }
}