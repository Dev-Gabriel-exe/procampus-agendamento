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

// ── POST público — pai se inscreve para UMA ou MÚLTIPLAS disciplinas ────────
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
      subjects,           // novo: array de IDs/nomes de disciplinas
      justified,
      reason,             // 'doenca' | 'luto' | 'autorizacao' | null
      lutoText,
      autorizacaoText,   // novo: descrição da autorização
      fileUrl,
    } = body

    if (!parentName || !parentEmail || !parentPhone || !studentName) {
      return NextResponse.json({ error: 'Dados obrigatórios faltando' }, { status: 400 })
    }

    const exam = await prisma.examSchedule.findUnique({ where: { id: params.id } })
    if (!exam || !exam.active) {
      return NextResponse.json({ error: 'Slot inválido ou inativo.' }, { status: 404 })
    }

    // Converte array de disciplinas para CSV
    const subjectsStr = Array.isArray(subjects) ? subjects.join(',') : (subjects || exam.subjectName)

    const booking = await prisma.examBooking.create({
      data: {
        examScheduleId: params.id,
        parentName,
        parentEmail,
        parentPhone,
        studentName,
        studentGrade: studentGrade || exam.grade,
        subjects: subjectsStr,           // novo: armazena CSV
        status: 'PENDING',
        justified: justified ?? false,
        reason: reason ?? null,
        lutoText: reason === 'luto' ? lutoText : null,
        autorizacaoText: reason === 'autorizacao' ? autorizacaoText : null,
        fileUrl: fileUrl ?? null,
      },
    })

    // Email de confirmação de recebimento ao pai
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(exam.date.toISOString())
      await transporter.sendMail({
        from: `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to: parentEmail,
        subject: '📄 Solicitação de Segunda Chamada recebida — Pro Campus',
        html: buildReceivedEmail({
          parentName,
          studentName,
          subjectName: subjectsStr,
          date: dateFormatted,
          startTime: exam.startTime,
          endTime: exam.endTime,
        }),
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de recebimento:', err)
    }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}

// ── DELETE — secretaria remove slot ──────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    await prisma.examSchedule.update({
      where: { id: params.id },
      data: { active: false },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao remover slot' }, { status: 500 })
  }
}

// ── Emails ────────────────────────────────────────────────────────────────
function buildReceivedEmail(d: {
  parentName: string; studentName: string; subjectName: string
  date: string; startTime: string; endTime: string
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4ff;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="padding:40px 20px;">
<tr><td align="center">
<table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#1a2060,#4054B2);padding:36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Segunda Chamada — Solicitação Recebida</p>
  </td></tr>
  <tr><td style="padding:28px 36px 0;text-align:center;">
    <div style="display:inline-block;background:#fef3c7;color:#b45309;padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;">⏳ Aguardando análise</div>
  </td></tr>
  <tr><td style="padding:20px 36px;">
    <h2 style="color:#1a2060;font-size:18px;margin-top:0;">Olá, ${d.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;">Recebemos a solicitação de segunda chamada para <strong>${d.studentName}</strong>. A secretaria irá analisar e enviar uma resposta em breve.</p>
    <table width="100%" style="background:#f7f9fe;border-radius:12px;border:1px solid #e0e7ff;margin-top:16px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Disciplina:</b></td><td style="padding:10px 16px;">${d.subjectName}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #e0e7ff;"><b>Data:</b></td><td style="padding:10px 16px;">${d.date}</td></tr>
      <tr><td style="padding:10px 16px;"><b>Horário:</b></td><td style="padding:10px 16px;">${d.startTime} – ${d.endTime}</td></tr>
    </table>
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