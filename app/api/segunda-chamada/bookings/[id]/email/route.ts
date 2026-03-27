// app/api/segunda-chamada/booking/[id]/email/route.ts
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  try {
    const { status } = await req.json()

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use APPROVED ou REJECTED.' },
        { status: 400 }
      )
    }

    const booking = await prisma.examBooking.findUnique({
      where:   { id: params.id },
      include: { examSchedule: true },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking não encontrado' }, { status: 404 })
    }

    const exam          = booking.examSchedule
    const dateFormatted = formatDateShort(exam.date.toISOString())

    const isApproved = status === 'APPROVED'

    const subject = isApproved
      ? '✅ Segunda Chamada Aprovada — Pro Campus'
      : '❌ Segunda Chamada Não Aprovada — Pro Campus'

    const badgeStyle = isApproved
      ? 'background:#dcfce7;color:#166534;'
      : 'background:#fee2e2;color:#991b1b;'

    const badgeText = isApproved ? '✅ Aprovado' : '❌ Não Aprovado'

    const bodyContent = isApproved
      ? `
        <p>A solicitação de segunda chamada para <strong>${booking.studentName}</strong> foi <strong style="color:#16a34a;">APROVADA</strong>.</p>
        <table style="width:100%;background:#f7fdf8;border-radius:10px;border:1px solid #bbf7d0;margin-top:16px;">
          <tr><td style="padding:10px 14px;border-bottom:1px solid #d1fae5;"><b>Disciplina:</b></td><td style="padding:10px 14px;">${exam.subjectName}</td></tr>
          <tr><td style="padding:10px 14px;border-bottom:1px solid #d1fae5;"><b>Data:</b></td><td style="padding:10px 14px;">${dateFormatted}</td></tr>
          <tr><td style="padding:10px 14px;"><b>Horário:</b></td><td style="padding:10px 14px;">${exam.startTime} – ${exam.endTime}</td></tr>
        </table>
        <div style="margin-top:20px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 16px;">
          <p style="margin:0;color:#15803d;font-size:14px;">
            📍 Apresente-se à secretaria com documento com foto e 10 minutos de antecedência.
          </p>
        </div>
      `
      : `
        <p>A solicitação de segunda chamada para <strong>${booking.studentName}</strong> <strong style="color:#dc2626;">não foi aprovada</strong>.</p>
        <p style="color:#6b7280;font-size:14px;">Para mais informações, entre em contato com a secretaria:</p>
        <div style="margin-top:16px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 16px;">
          <p style="margin:0;color:#991b1b;font-size:14px;">
            📞 (86) 2106-0606
          </p>
        </div>
      `

    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head><meta charset="UTF-8"></head>
      <body style="margin:0;padding:0;background:#f0faf2;font-family:'Segoe UI',Arial,sans-serif;">
      <table width="100%" style="padding:40px 20px;">
      <tr><td align="center">
      <table width="580" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
        <tr>
          <td style="background:linear-gradient(135deg,#0D2818,#1a7a2e);padding:36px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;font-weight:800;">Pro Campus</h1>
            <p style="color:rgba(255,255,255,0.55);margin:6px 0 0;font-size:13px;">Grupo Educacional — Teresina, PI</p>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 36px 0;text-align:center;">
            <div style="display:inline-block;${badgeStyle}padding:8px 20px;border-radius:999px;font-weight:700;font-size:14px;">
              ${badgeText}
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 36px;">
            <h2 style="color:#0D2818;font-size:18px;margin-top:0;">Olá, ${booking.parentName}!</h2>
            ${bodyContent}
          </td>
        </tr>
        <tr>
          <td style="background:#f7fdf8;padding:20px 36px;text-align:center;border-top:1px solid #e5e7eb;">
            <p style="color:#6b8f72;font-size:12px;margin:0;">
              © ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí
            </p>
          </td>
        </tr>
      </table>
      </td></tr>
      </table>
      </body>
      </html>
    `

    const transporter = createTransport()
    await transporter.sendMail({
      from: `"Pro Campus" <${process.env.GMAIL_USER}>`,
      to:   booking.parentEmail,
      subject,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Erro ao enviar e-mail' }, { status: 500 })
  }
}