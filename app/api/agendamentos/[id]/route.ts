// app/api/agendamentos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { Resend } from 'resend'
import { formatDateShort } from '@/lib/slots'

export const dynamic = 'force-dynamic'

// ── PATCH — cancela e envia email ────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { status } = await req.json()

  const appt = await prisma.appointment.update({
    where: { id: params.id },
    data:  { status },
    include: { availability: { include: { teacher: true } } },
  })

  // Dispara email de cancelamento para o responsável
  if (status === 'cancelled') {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const dateFormatted = formatDateShort(appt.date)

      await resend.emails.send({
        from:    process.env.EMAIL_FROM!,
        to:      appt.parentEmail,
        subject: `❌ Reunião cancelada — ${(appt as any).subjectName || 'Pro Campus'}`,
        html: buildCancellationEmail({
          parentName:  appt.parentName,
          studentName: appt.studentName,
          teacherName: appt.availability.teacher.name,
          subject:     (appt as any).subjectName || 'Reunião Pedagógica',
          grade:       appt.studentGrade,
          date:        dateFormatted,
          startTime:   appt.startTime,
        }),
      })
    } catch (err) {
      // Não bloqueia a resposta se o email falhar
      console.error('Erro ao enviar email de cancelamento:', err)
    }
  }

  return NextResponse.json(appt)
}

// ── DELETE — remove permanentemente ─────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  // Só permite apagar cancelados ou passados
  const appt = await prisma.appointment.findUnique({ where: { id: params.id } })
  if (!appt) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  const isPast      = new Date(appt.date) < new Date()
  const isCancelled = appt.status === 'cancelled'

  if (!isPast && !isCancelled) {
    return NextResponse.json(
      { error: 'Só é possível apagar agendamentos cancelados ou já realizados.' },
      { status: 403 }
    )
  }

  await prisma.appointment.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}

// ── Template email de cancelamento ──────────────────────
function buildCancellationEmail(data: {
  parentName: string
  studentName: string
  teacherName: string
  subject: string
  grade: string
  date: string
  startTime: string
}) {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fef2f2;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 30px rgba(239,68,68,0.1);">

  <tr><td style="background:linear-gradient(135deg,#1a1a1a,#2d2d2d);padding:36px 40px;text-align:center;">
    <h1 style="color:#ffffff;font-size:22px;font-weight:800;margin:0;">Pro Campus</h1>
    <p style="color:rgba(255,255,255,0.5);margin:6px 0 0;font-size:13px;">Grupo Educacional — Teresina, PI</p>
  </td></tr>

  <tr><td style="padding:28px 40px 0;text-align:center;">
    <div style="display:inline-block;background:#fef2f2;color:#dc2626;padding:8px 20px;border-radius:100px;font-size:13px;font-weight:700;border:1px solid #fecaca;">
      ❌ Reunião Cancelada
    </div>
  </td></tr>

  <tr><td style="padding:20px 40px 0;">
    <h2 style="color:#1a1a1a;font-size:18px;font-weight:700;margin:0;">Olá, ${data.parentName}!</h2>
    <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:10px 0 0;">
      Infelizmente a reunião abaixo foi <strong style="color:#dc2626;">cancelada</strong> pela secretaria.
      Entre em contato para reagendar quando necessário.
    </p>
  </td></tr>

  <tr><td style="padding:20px 40px;">
    <table width="100%" style="background:#fafafa;border-radius:14px;border:1px solid #fee2e2;overflow:hidden;">
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Professor(a)</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.teacherName}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Disciplina / Série</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.subject} — ${data.grade}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;border-bottom:1px solid #fee2e2;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Aluno</span>
        <p style="color:#1a1a1a;font-size:15px;font-weight:700;margin:4px 0 0;">${data.studentName}</p>
      </td></tr>
      <tr><td style="padding:14px 20px;">
        <span style="color:#9ca3af;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Data e Horário cancelados</span>
        <p style="color:#dc2626;font-size:18px;font-weight:800;margin:4px 0 0;text-decoration:line-through;opacity:0.7;">
          📅 ${data.date} às ${data.startTime}
        </p>
      </td></tr>
    </table>
  </td></tr>

  <tr><td style="padding:0 40px 28px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:14px 18px;">
      <p style="color:#15803d;font-size:13px;font-weight:600;margin:0;">
        💬 Para reagendar, acesse o site ou entre em contato com a secretaria: (86) 2106-0606
      </p>
    </div>
  </td></tr>

  <tr><td style="background:#fafafa;padding:20px 40px;text-align:center;border-top:1px solid #fee2e2;">
    <p style="color:#9ca3af;font-size:12px;margin:0;">© ${new Date().getFullYear()} Grupo Educacional Pro Campus — Teresina, Piauí</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`
}