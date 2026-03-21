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
    auth: { user: process.env.GMAIL_USER!, pass: process.env.GMAIL_PASS! },
  })
}

// DELETE — cancela/desativa a prova
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await prisma.examSchedule.update({
      where: { id: params.id },
      data:  { active: false },
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erro ao cancelar prova' }, { status: 500 })
  }
}

// POST — agendamento do pai para a prova (rota pública)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { parentName, parentEmail, parentPhone, studentName, studentGrade } = await req.json()

    if (!parentName || !parentEmail || !parentPhone || !studentName || !studentGrade) {
      return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
    }

    const exam = await prisma.examSchedule.findUnique({
      where: { id: params.id },
    })
    if (!exam || !exam.active) {
      return NextResponse.json({ error: 'Prova não encontrada ou inativa.' }, { status: 404 })
    }
    if (new Date(exam.date) < new Date()) {
      return NextResponse.json({ error: 'Esta prova já ocorreu.' }, { status: 400 })
    }

    // Verifica se o aluno já agendou esta prova
    const existing = await prisma.examBooking.findFirst({
      where: { examScheduleId: params.id, studentName, status: 'confirmed' },
    })
    if (existing) {
      return NextResponse.json({ error: 'Este aluno já está inscrito nesta prova.' }, { status: 409 })
    }

    const booking = await prisma.examBooking.create({
      data: { examScheduleId: params.id, parentName, parentEmail, parentPhone, studentName, studentGrade },
    })

    // Email de confirmação
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(exam.date)
      await transporter.sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      parentEmail,
        subject: `✅ Segunda Chamada confirmada — ${exam.subjectName} | Pro Campus`,
        html: buildConfirmationEmail({ parentName, studentName, studentGrade, subjectName: exam.subjectName, grade: exam.grade, date: dateFormatted, startTime: exam.startTime, endTime: exam.endTime }),
      })
    } catch (err) {
      console.error('Erro ao enviar email:', err)
    }

    return NextResponse.json(booking, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao realizar inscrição' }, { status: 500 })
  }
}

function buildConfirmationEmail(data: {
  parentName: string; studentName: string; studentGrade: string
  subjectName: string; grade: string; date: string; startTime: string; endTime: string
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4ff;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(64,84,178,0.12);">
  <tr><td style="background:linear-gradient(135deg,#1a2060,#2d3a8c,#4054B2);padding:36px 40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:24px;font-weight:800;margin:0;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Segunda Chamada — Grupo Educacional</p>
  </td></tr>
  <tr><td style="padding:28px 40px 0;text-align:center;">
    <div style="display:inline-block;background:#eef1fb;color:#4054B2;padding:8px 20px;border-radius:100px;font-size:13px;font-weight:700;">
      ✅ Inscrição Confirmada
    </div>
  </td></tr>
  <tr><td style="padding:20px 40px 0;">
    <h2 style="color:#1a2060;font-size:18px;font-weight:700;margin:0;">Olá, ${data.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:10px 0 0;">
      A inscrição na prova de segunda chamada foi confirmada com sucesso.
    </p>
  </td></tr>
  <tr><td style="padding:20px 40px 32px;">
    <table width="100%" style="background:#f7f9fe;border-radius:14px;border:1px solid rgba(64,84,178,0.12);overflow:hidden;">
      <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(64,84,178,0.08);">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Aluno</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.studentName}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid rgba(64,84,178,0.08);">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Disciplina / Série</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.subjectName} — ${data.grade}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data e Horário</span>
        <p style="color:#4054B2;font-size:20px;font-weight:800;margin:4px 0 0;">📅 ${data.date} às ${data.startTime}</p>
        <p style="color:#6b7280;font-size:12px;margin:4px 0 0;">Término previsto: ${data.endTime}</p>
      </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:0 40px 28px;">
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:14px 18px;">
      <p style="color:#c2410c;font-size:13px;font-weight:600;margin:0;">📍 Local: Grupo Educacional Pro Campus — Teresina, PI</p>
      <p style="color:#92400e;font-size:12px;margin:6px 0 0;">Apresente-se com 10 minutos de antecedência e traga documento com foto.</p>
    </div>
  </td></tr>
  <tr><td style="background:#f7f9fe;padding:18px 40px;text-align:center;border-top:1px solid rgba(64,84,178,0.08);">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
    <p style="color:#9ca3af;font-size:11px;margin:5px 0 0;">Dúvidas? (86) 2106-0606</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}