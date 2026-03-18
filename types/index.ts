// ============================================================
// ARQUIVO: src/types/index.ts
// CAMINHO: procampus-agendamento/src/types/index.ts
// SUBSTITUA o arquivo inteiro
// ============================================================

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo'       },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira'   },
  { value: 3, label: 'Quarta-feira'  },
  { value: 4, label: 'Quinta-feira'  },
  { value: 5, label: 'Sexta-feira'   },
  { value: 6, label: 'Sábado'        },
]

export function getDayLabel(dayOfWeek: number): string {
  return DAYS_OF_WEEK.find(d => d.value === dayOfWeek)?.label ?? '—'
}

// Retorna as próximas N ocorrências de um dia da semana a partir de hoje
export function getNextOccurrences(dayOfWeek: number, weeks = 4): Date[] {
  const dates: Date[] = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  for (let w = 0; w < weeks; w++) {
    const date = new Date(today)
    const diff = (dayOfWeek - today.getDay() + 7) % 7
    date.setDate(today.getDate() + diff + w * 7)
    // Se diff === 0 e w === 0, é hoje — só inclui se ainda há tempo
    if (diff === 0 && w === 0) {
      const now = new Date()
      if (now.getHours() >= 17) continue // se já passou das 17h, pula hoje
    }
    dates.push(date)
  }
  return dates
}

export interface Teacher {
  id: string
  name: string
  email: string
  phone: string
  subjects: TeacherSubject[]
  availabilities?: Availability[]
  createdAt: Date
  updatedAt: Date
}

export interface Subject {
  id: string
  name: string
  grade: string
}

export interface TeacherSubject {
  teacherId: string
  subjectId: string
  teacher?: Teacher
  subject?: Subject
}

export interface Availability {
  id: string
  teacherId: string
  teacher?: Teacher
  dayOfWeek: number   // 0–6
  startTime: string
  endTime: string
  active: boolean
  createdAt: Date
}

export interface Appointment {
  id: string
  availabilityId: string
  availability?: Availability & { teacher?: Teacher }
  date: Date
  startTime: string
  endTime: string
  parentName: string
  parentEmail: string
  parentPhone: string
  reason: string
  studentName: string
  studentGrade: string
  status: string
  createdAt: Date
  
}

// Slot disponível que o pai vê ao agendar
export interface AvailableSlot {
  availabilityId: string
  date: Date
  dateLabel: string   // "terça-feira, 21 de janeiro"
  startTime: string
  endTime: string
  teacherName: string
  teacherId: string
  subjectName: string
  subjectGrade: string
  isBooked: boolean
}