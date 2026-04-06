// app/api/recuperacao/booking/[id]/reject/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import nodemailer from 'nodemailer'

export const dynamic = 'force-dynamic'

function createTransport() {
  return nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER!, pass: process.env.GMAIL_PASS! } })
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    let rejectReason: string | null = null
    try { const body = await req.json(); rejectReason = body?.rejectReason ?? null } catch { /* ok */ }

    const booking = await prisma.recoveryBooking.update({
      where: { id: params.id },
      data:  { status: 'REJECTED' },
      include: { recoverySchedule: true },
    })

    try {
      const s = booking.recoverySchedule
      const isParalela = s.type === 'paralela'
      const subjectsList = booking.subjects ? booking.subjects.split(',').map(x => x.trim()).filter(Boolean) : []

      await createTransport().sendMail({
        from:    `"Pro Campus" <${process.env.GMAIL_USER}>`,
        to:      booking.parentEmail,
        subject: '❌ Inscrição em Recuperação não aprovada — Pro Campus',
        html: `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#fff5f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" style="padding:40px 20px;"><tr><td align="center">
<table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
  <tr><td style="background:linear-gradient(135deg,#0D2818,#1a7a2e);padding:36px;text-align:center;">
    <h1 style="color:#fff;margin:0;font-size:22px;">Pro Campus</h1>
  </td></tr>
  <tr><td style="padding:28px 36px 0;text-align:center;">
    <div style="display:inline-block;background:#fee2e2;color:#991b1b;padding:8px 20px;border-radius:100px;font-weight:700;font-size:14px;">❌ Não aprovado</div>
  </td></tr>
  <tr><td style="padding:20px 36px;">
    <h2 style="color:#1a2060;font-size:18px;margin-top:0;">Olá, ${booking.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;">Infelizmente a inscrição de <strong>${booking.studentName}</strong> na recuperação de <strong>${isParalela ? subjectsList.join(', ') : s.subjectName}</strong> — ${s.grade} não foi aprovada.</p>
    ${rejectReason ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;margin-top:16px;"><p style="margin:0;font-weight:700;font-size:13px;color:#991b1b;">Motivo:</p><p style="margin:6px 0 0;color:#7f1d1d;font-size:14px;">${rejectReason}</p></div>` : ''}
    <div style="margin-top:20px;background:#f0f4ff;border:1px solid #c7d2fb;border-radius:10px;padding:14px 16px;">
      <p style="margin:0;color:#3730a3;font-size:14px;">📞 Para mais informações: <strong>(86) 2106-0606</strong></p>
    </div>
  </td></tr>
  <tr><td style="background:#f7f9fe;padding:18px 36px;text-align:center;border-top:1px solid #e5e7eb;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
  </td></tr>
</table></td></tr></table></body></html>`,
      })
    } catch (err) { console.error('Email reject error:', err) }

    return NextResponse.json(booking)
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao reprovar' }, { status: 500 })
  }
}