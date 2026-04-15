// components/secretaria/PrintByTurma.tsx
import { extractTurma, extractGrade } from '@/lib/turmas'

interface StudentWithSubjects {
  name: string
  grade: string
  subjects: string[]
}

interface PrintByTurmaProps {
  students: StudentWithSubjects[]
  title: string
}

export default function PrintByTurma({ students, title }: PrintByTurmaProps) {
  // Agrupa alunos por turma formatada
  const groupedByTurma = students.reduce(
    (acc, student) => {
      const serie = extractGrade(student.grade) || 'Série desconhecida'
      const turmaRaw = extractTurma(student.grade) || ''
      // Formata: "Turma A" → "A" e combina: "6º Ano Fundamental" + "A" → "6º Ano A"
      const turmaLetter = turmaRaw.replace('Turma ', '').trim()
      const turmaFormatted = turmaLetter ? `${serie} ${turmaLetter}` : serie
      
      if (!acc[turmaFormatted]) acc[turmaFormatted] = []
      acc[turmaFormatted].push(student)
      return acc
    },
    {} as Record<string, StudentWithSubjects[]>
  )

  // Ordena turmas
  const sortedTurmas = Object.keys(groupedByTurma).sort()

  return (
    <div className="print-only" style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      {/* Cabeçalho */}
      <div style={{ textAlign: 'center', marginBottom: 40, borderBottom: '3px solid #23A455', paddingBottom: 20 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 'bold', color: '#0a1a0d', fontFamily: '"Roboto Slab", serif' }}>
          Pro Campus — {title}
        </h1>
        <p style={{ margin: '0', fontSize: 13, color: '#6b7280' }}>
          Gerado em{' '}
          {new Date().toLocaleDateString('pt-BR', {
            timeZone: 'America/Fortaleza',
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
          {' '}às{' '}
          {new Date().toLocaleTimeString('pt-BR', {
            timeZone: 'America/Fortaleza',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      {/* Turmas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
        {sortedTurmas.map((turma) => (
          <div key={turma} style={{ pageBreakInside: 'avoid' }}>
            {/* Título da Turma */}
            <h2
              style={{
                margin: '0 0 16px',
                fontSize: 18,
                fontWeight: 'bold',
                color: '#23A455',
                borderBottom: '2px solid #e8f9eb',
                paddingBottom: 10,
              }}
            >
              {turma}
            </h2>

            {/* Tabela de alunos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 8 }}>
              <tbody>
                {groupedByTurma[turma]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((student, idx) => (
                    <tr
                      key={`${turma}-${idx}`}
                      style={{
                        borderBottom: '1px solid #e5e7eb',
                        height: 28,
                      }}
                    >
                      <td
                        style={{
                          padding: '8px 12px',
                          fontSize: 13,
                          fontWeight: '600',
                          color: '#0a1a0d',
                          width: '35%',
                          verticalAlign: 'middle',
                        }}
                      >
                        {student.name}
                      </td>
                      <td
                        style={{
                          padding: '8px 12px',
                          fontSize: 12,
                          color: '#374151',
                          verticalAlign: 'middle',
                        }}
                      >
                        {student.subjects.length > 0
                          ? student.subjects.join(', ')
                          : '—'}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Total de alunos */}
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 11,
                color: '#9ca3af',
                textAlign: 'right',
                fontStyle: 'italic',
              }}
            >
              Total: {groupedByTurma[turma].length} aluno{groupedByTurma[turma].length !== 1 ? 's' : ''}
            </p>
          </div>
        ))}
      </div>

      {/* Rodapé */}
      <div
        style={{
          marginTop: 60,
          paddingTop: 20,
          borderTop: '1px solid #e5e7eb',
          fontSize: 11,
          color: '#9ca3af',
          textAlign: 'center',
        }}
      >
        <p style={{ margin: 0 }}>
          Total geral: {students.length} aluno{students.length !== 1 ? 's' : ''}
        </p>
      </div>
    </div>
  )
}
