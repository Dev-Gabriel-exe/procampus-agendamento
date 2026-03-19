// ============================================================
// ARQUIVO: lib/slots.ts
// CAMINHO: lib/slots.ts (raiz do projeto)
// ============================================================

// ✅ generateSlots agora usa 20min por padrão
export function generateSlots(startTime: string, endTime: string, duration = 20) {
  const slots: { startTime: string; endTime: string }[] = []
  const [sh, sm] = startTime.split(':').map(Number)
  const [eh, em] = endTime.split(':').map(Number)
  let current = sh * 60 + sm
  const end   = eh * 60 + em

  while (current + duration <= end) {
    const s = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    current += duration
    const e = `${String(Math.floor(current / 60)).padStart(2, '0')}:${String(current % 60).padStart(2, '0')}`
    slots.push({ startTime: s, endTime: e })
  }
  return slots
}

export function getNextOccurrences(dayOfWeek: number, weeks = 4): Date[] {
  const dates: Date[] = []
  const now = new Date()

  const brasiliaOffset = 3 * 60 * 60 * 1000
  const brasiliaTime   = new Date(now.getTime() - brasiliaOffset)
  const todayDay       = brasiliaTime.getUTCDay()
  const todayY         = brasiliaTime.getUTCFullYear()
  const todayM         = brasiliaTime.getUTCMonth()
  const todayD         = brasiliaTime.getUTCDate()

  for (let w = 0; w < weeks; w++) {
    const diff      = (dayOfWeek - todayDay + 7) % 7
    let   daysToAdd = diff + w * 7

    if (diff === 0 && w === 0) {
      const brasiliaHour = brasiliaTime.getUTCHours()
      if (brasiliaHour >= 17) daysToAdd = 7
    }

    const date = new Date(Date.UTC(todayY, todayM, todayD + daysToAdd, 12, 0, 0, 0))
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
    timeZone: 'America/Fortaleza',
  })
}

export function formatDateShort(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    timeZone: 'America/Fortaleza',
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