// ============================================================
// ARQUIVO: src/lib/slots.ts
// CAMINHO: procampus-agendamento/src/lib/slots.ts
// SUBSTITUA o arquivo inteiro
// ============================================================

export function generateSlots(startTime: string, endTime: string) {
  const slots: { startTime: string; endTime: string }[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end   = eh * 60 + em

  while (current + 30 <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    current += 30
    const e = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    slots.push({ startTime: s, endTime: e })
  }
  return slots
}

// ⚠️ Usa UTC em tudo — mesma base do banco de dados
export function getNextOccurrences(dayOfWeek: number, weeks = 4): Date[] {
  const dates: Date[] = []

  // Meia-noite UTC de hoje
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  const todayDayUTC = today.getUTCDay()

  for (let w = 0; w < weeks; w++) {
    const diff      = (dayOfWeek - todayDayUTC + 7) % 7
    const daysToAdd = diff + w * 7

    // Se é hoje (diff===0, w===0) e já passou das 17h Brasília (20h UTC), pula
    if (diff === 0 && w === 0) {
      const nowUTCHour = new Date().getUTCHours()
      if (nowUTCHour >= 20) continue
    }

    const date = new Date(today)
    date.setUTCDate(today.getUTCDate() + daysToAdd)
    dates.push(date)
  }

  return dates
}

export function formatTime(time: string) {
  return time.replace(':', 'h')
}

export function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  })
}

export function getWeekRange(date: Date) {
  const start = new Date(date)
  start.setDate(date.getDate() - date.getDay())
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}