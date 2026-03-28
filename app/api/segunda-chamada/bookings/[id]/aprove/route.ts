// app/api/segunda-chamada/booking/[id]/approve/route.ts
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

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const booking = await prisma.examBooking.update({
      where: { id: params.id },
      data:  { status: 'APPROVED' },
      include: { examSchedule: true },
    })

    // ✅ Envia email de aprovação automaticamente
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(booking.examSchedule.date.toISOString())
      await transporter.sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      booking.parentEmail,
        subject: '✅ Segunda Chamada Aprovada — Pro Campus',
        html:    buildApprovalEmail({
          parentName:  booking.parentName,
          studentName: booking.studentName,
          subjectName: booking.examSchedule.subjectName,
          grade:       booking.examSchedule.grade,
          date:        dateFormatted,
          startTime:   booking.examSchedule.startTime,
          endTime:     booking.examSchedule.endTime,
        }),
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de aprovação:', err)
    }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao aprovar' }, { status: 500 })
  }
}

function buildApprovalEmail(d: {
  parentName: string; studentName: string; subjectName: string
  grade: string; date: string; startTime: string; endTime: string
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="padding:40px 20px;">
<tr><td align="center">
<table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0D2818,#1a7a2e);padding:36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Segunda Chamada</p>
  </td></tr>
  <tr><td style="padding:28px 36px 0;text-align:center;">
    <div style="display:inline-block;background:#dcfce7;color:#166534;padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;">✅ Aprovado</div>
  </td></tr>
  <tr><td style="padding:20px 36px;">
    <h2 style="color:#0D2818;font-size:18px;margin-top:0;">Olá, ${d.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;">A segunda chamada de <strong>${d.studentName}</strong> foi <strong style="color:#16a34a;">APROVADA</strong>.</p>
    <table width="100%" style="background:#f0fdf4;border-radius:12px;border:1px solid #bbf7d0;margin-top:16px;">
      <tr><td style="padding:10px 16px;border-bottom:1px solid #bbf7d0;"><b>Disciplina:</b></td><td style="padding:10px 16px;">${d.subjectName} — ${d.grade}</td></tr>
      <tr><td style="padding:10px 16px;border-bottom:1px solid #bbf7d0;"><b>Data:</b></td><td style="padding:10px 16px;">${d.date}</td></tr>
      <tr><td style="padding:10px 16px;"><b>Horário:</b></td><td style="padding:10px 16px;">${d.startTime} – ${d.endTime}</td></tr>
    </table>
    <div style="margin-top:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;">
      <p style="margin:0;color:#15803d;font-size:14px;">📍 Apresente-se à secretaria com documento com foto e 10 minutos de antecedência.</p>
    </div>
  </td></tr>
  <tr><td style="background:#f7fdf8;padding:18px 36px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí · (86) 2106-0606</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}