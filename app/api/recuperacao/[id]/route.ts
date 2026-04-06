// app/api/recuperacao/[id]/route.ts
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

// DELETE — secretaria desativa slot
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  try {
    await prisma.recoverySchedule.update({ where: { id: params.id }, data: { active: false } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Erro ao remover slot' }, { status: 500 })
  }
}

// POST — pai se inscreve (público)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { parentName, parentEmail, parentPhone, studentName, studentGrade, subjects, fileUrl } = await req.json()

    if (!parentName || !parentEmail || !parentPhone || !studentName) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 })
    }

    const schedule = await prisma.recoverySchedule.findUnique({ where: { id: params.id } })
    if (!schedule || !schedule.active) {
      return NextResponse.json({ error: 'Slot inválido ou inativo.' }, { status: 404 })
    }

    const booking = await prisma.recoveryBooking.create({
      data: {
        recoveryScheduleId: params.id,
        parentName, parentEmail, parentPhone,
        studentName, studentGrade: studentGrade || schedule.grade,
        subjects: subjects || '',
        fileUrl: fileUrl ?? null,
        status: 'PENDING',
      },
    })

    // Email de confirmação ao pai
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(schedule.date.toISOString())
      const isParalela = schedule.type === 'paralela'
      const subjectsList = subjects ? subjects.split(',').map((s: string) => s.trim()).filter(Boolean) : []

      await transporter.sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      parentEmail,
        subject: `📚 Inscrição em Recuperação recebida — Pro Campus`,
        html:    buildConfirmEmail({ parentName, studentName, subjectName: schedule.subjectName, grade: schedule.grade, date: dateFormatted, startTime: schedule.startTime, endTime: schedule.endTime, isParalela, subjectsList, period: schedule.period }),
      })
    } catch (err) {
      console.error('Erro ao enviar email:', err)
    }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

function buildConfirmEmail(d: {
  parentName: string; studentName: string; subjectName: string
  grade: string; date: string; startTime: string; endTime: string
  isParalela: boolean; subjectsList: string[]; period: string | null
}) {
  const typeLabel = d.isParalela ? 'Recuperação Paralela (Gratuita)' : 'Recuperação Normal'
  const periodLabel = d.period === 'meio' ? 'Meio do Ano' : d.period === 'final' ? 'Final do Ano' : ''
  const subjectsHtml = d.isParalela && d.subjectsList.length > 0
    ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Disciplinas:</b></td><td style="padding:10px 16px;">${d.subjectsList.join(', ')}</td></tr>`
    : `<tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Disciplina:</b></td><td style="padding:10px 16px;">${d.subjectName}</td></tr>`

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="padding:40px 20px;">
<tr><td align="center">
<table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0D2818,#1a7a2e);padding:36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Recuperação — ${typeLabel}</p>
  </td></tr>
  <tr><td style="padding:28px 36px 0;text-align:center;">
    <div style="display:inline-block;background:#fef3c7;color:#b45309;padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;">⏳ Aguardando análise</div>
  </td></tr>
  <tr><td style="padding:20px 36px;">
    <h2 style="color:#0D2818;font-size:18px;margin-top:0;">Olá, ${d.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;">Recebemos a inscrição de <strong>${d.studentName}</strong> para a recuperação. A secretaria irá analisar em breve.</p>
    <table width="100%" style="background:#f7f9fe;border-radius:12px;border:1px solid #e0e7ff;margin-top:16px;">
      ${subjectsHtml}
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Série:</b></td><td style="padding:10px 16px;">${d.grade}</td></tr>
      ${periodLabel ? `<tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Período:</b></td><td style="padding:10px 16px;">${periodLabel}</td></tr>` : ''}
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Data:</b></td><td style="padding:10px 16px;">${d.date}</td></tr>
      <tr><td style="padding:10px 16px;"><b>Horário:</b></td><td style="padding:10px 16px;">${d.startTime} – ${d.endTime}</td></tr>
    </table>
    ${!d.isParalela ? `
    <div style="margin-top:16px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px;">
      <p style="margin:0;color:#c2410c;font-size:13px;font-weight:600;">💰 Taxa: R$ 30,00 via PIX</p>
      <p style="margin:6px 0 0;color:#92400e;font-size:12px;">Caso já tenha pago, aguarde a confirmação da secretaria.</p>
    </div>` : `
    <div style="margin-top:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;">
      <p style="margin:0;color:#15803d;font-size:13px;font-weight:600;">✅ Recuperação Paralela — Gratuita</p>
    </div>`}
  </td></tr>
  <tr><td style="background:#f7f9fe;padding:18px 36px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}