// app/api/segunda-chamada/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'
import { formatDateShort } from '@/lib/slots'

export const dynamic = 'force-dynamic'

function createTransport() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER!,
      pass: process.env.GMAIL_PASS!,
    },
  })
}

// ── POST — pai se inscreve num slot ────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()

    const {
      parentName,
      parentEmail,
      parentPhone,
      studentName,
      studentGrade,
      // campos do novo fluxo de justificativa
      justified,  // boolean: true = justificada, false = não justificada
      reason,     // 'doenca' | 'luto' | null
      lutoText,   // string | null (somente quando reason === 'luto')
      fileUrl,    // URL do arquivo já enviado ao Cloudinary pelo frontend
    } = body

    if (!parentName || !parentEmail || !parentPhone || !studentName) {
      return NextResponse.json(
        { error: 'Dados obrigatórios faltando' },
        { status: 400 }
      )
    }

    const exam = await prisma.examSchedule.findUnique({
      where: { id: params.id },
    })

    if (!exam) {
      return NextResponse.json({ error: 'Slot inválido' }, { status: 404 })
    }

    const booking = await prisma.examBooking.create({
      data: {
        examScheduleId: params.id,
        parentName,
        parentEmail,
        parentPhone,
        studentName,
        studentGrade: studentGrade || exam.grade,
        status:       'PENDING',
        justified:    justified   ?? false,
        reason:       reason      ?? null,
        lutoText:     lutoText    ?? null,
        fileUrl:      fileUrl     ?? null,
      },
    })

    // E-mail de confirmação de recebimento (não bloqueia a resposta se falhar)
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(exam.date.toISOString())

      await transporter.sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      parentEmail,
        subject: '📄 Solicitação de Segunda Chamada recebida',
        html: `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:520px;margin:0 auto;">
            <div style="background:linear-gradient(135deg,#0D2818,#1a7a2e);padding:32px;text-align:center;border-radius:16px 16px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:22px;">Pro Campus</h1>
            </div>
            <div style="background:#fff;padding:28px;border-radius:0 0 16px 16px;border:1px solid #e5e7eb;">
              <h2 style="color:#0D2818;margin-top:0;">Solicitação recebida!</h2>
              <p>Olá <strong>${parentName}</strong>,</p>
              <p>Recebemos a solicitação de segunda chamada para:</p>
              <table style="width:100%;background:#f7fdf8;border-radius:10px;padding:4px;">
                <tr><td style="padding:10px;"><b>Aluno:</b></td><td>${studentName}</td></tr>
                <tr><td style="padding:10px;"><b>Disciplina:</b></td><td>${exam.subjectName}</td></tr>
                <tr><td style="padding:10px;"><b>Data:</b></td><td>${dateFormatted}</td></tr>
                <tr><td style="padding:10px;"><b>Horário:</b></td><td>${exam.startTime} – ${exam.endTime}</td></tr>
              </table>
              <p style="margin-top:20px;color:#6b7280;font-size:14px;">
                A secretaria irá analisar sua solicitação e retornará em breve.
              </p>
            </div>
          </div>
        `,
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de confirmação:', err)
    }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE — secretaria remove slot ───────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    await prisma.examSchedule.delete({ where: { id: params.id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao deletar slot' }, { status: 500 })
  }
}