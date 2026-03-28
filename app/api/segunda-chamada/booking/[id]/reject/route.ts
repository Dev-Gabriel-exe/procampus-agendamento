// app/api/segunda-chamada/booking/[id]/reject/route.ts
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
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    // ✅ Campo renomeado para secretariaReason (alinhado com o frontend)
    let secretariaReason: string | null = null
    try {
      const body = await req.json()
      secretariaReason = body?.secretariaReason ?? null
    } catch { /* body vazio é ok */ }

    const booking = await prisma.examBooking.update({
      where: { id: params.id },
      data:  { status: 'REJECTED' },
      include: { examSchedule: true },
    })

    // Envia e-mail de rejeição automaticamente
    try {
      const transporter = createTransport()
      const dateFormatted = formatDateShort(booking.examSchedule.date.toISOString())
      await transporter.sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      booking.parentEmail,
        subject: '❌ Segunda Chamada não aprovada — Pro Campus',
        html:    buildRejectionEmail({
          parentName:       booking.parentName,
          studentName:      booking.studentName,
          subjectName:      booking.examSchedule.subjectName,
          grade:            booking.examSchedule.grade,
          date:             dateFormatted,
          secretariaReason,
        }),
      })
    } catch (err) {
      console.error('Erro ao enviar e-mail de rejeição:', err)
    }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao reprovar' }, { status: 500 })
  }
}

function buildRejectionEmail(d: {
  parentName: string; studentName: string; subjectName: string
  grade: string; date: string; secretariaReason: string | null
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="padding:40px 20px;">
<tr><td align="center">
<table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#1a2060,#4054B2);padding:36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.6);margin:6px 0 0;font-size:13px;">Segunda Chamada</p>
  </td></tr>
  <tr><td style="padding:28px 36px 0;text-align:center;">
    <div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;">❌ Não aprovado</div>
  </td></tr>
  <tr><td style="padding:20px 36px;">
    <h2 style="color:#1a2060;font-size:18px;margin-top:0;">Olá, ${d.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;">Infelizmente a solicitação de segunda chamada para <strong>${d.studentName}</strong> na disciplina <strong>${d.subjectName} — ${d.grade}</strong> referente ao dia <strong>${d.date}</strong> não foi aprovada.</p>
    ${d.secretariaReason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-top:16px;">
      <p style="margin:0;font-weight:700;font-size:13px;color:#991b1b;">Motivo:</p>
      <p style="margin:6px 0 0;color:#7f1d1d;font-size:14px;">${d.secretariaReason}</p>
    </div>` : ''}
    <div style="margin-top:20px;background:#f0f4ff;border:1px solid #c7d2fb;border-radius:10px;padding:14px 16px;">
      <p style="margin:0;color:#3730a3;font-size:14px;">📞 Para mais informações, entre em contato com a secretaria: <strong>(86) 2106-0606</strong></p>
    </div>
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