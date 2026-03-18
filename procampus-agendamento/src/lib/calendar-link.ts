// ============================================================
// ARQUIVO: src/lib/calendar-link.ts
// CAMINHO: procampus-agendamento/src/lib/calendar-link.ts
// ============================================================
 
interface CalendarLinkParams {
  title: string
  date: string       // "2025-01-20"
  startTime: string  // "08:00"
  endTime: string    // "08:30"
  description: string
  location?: string
}
 
export function generateCalendarLink({
  title, date, startTime, endTime, description,
  location = 'Grupo Educacional Pro Campus — Teresina, PI',
}: CalendarLinkParams) {
  const fmt = (d: string, t: string) => `${d.replace(/-/g, '')}T${t.replace(':', '')}00`
 
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(date, startTime)}/${fmt(date, endTime)}`,
    details: description,
    location,
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}