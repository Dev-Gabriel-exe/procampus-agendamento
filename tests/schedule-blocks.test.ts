import assert from 'node:assert/strict'
import {
  appointmentStartUtc,
  blockAppliesToTeacher,
  blocksTeacherOnDate,
  isDateInsideBlock,
  parseDateInput,
} from '../lib/schedule-blocks'

const collective = {
  startDate: new Date('2026-09-21T12:00:00.000Z'),
  endDate: new Date('2026-09-25T12:00:00.000Z'),
  teacherId: null,
  role: 'geral',
}

assert.equal(parseDateInput('2026-02-29'), null, 'deve rejeitar data inexistente')
assert.equal(parseDateInput('2028-02-29')?.toISOString(), '2028-02-29T12:00:00.000Z')
assert.equal(isDateInsideBlock('2026-09-21T12:00:00.000Z', collective), true, 'início deve ser inclusivo')
assert.equal(isDateInsideBlock('2026-09-25T12:00:00.000Z', collective), true, 'fim deve ser inclusivo')
assert.equal(isDateInsideBlock('2026-09-26T12:00:00.000Z', collective), false)
assert.equal(blockAppliesToTeacher(collective, { id: 'prof-1', role: 'fund1' }), true, 'geral bloqueia todos')

const fund1Collective = { ...collective, role: 'fund1' }
assert.equal(blockAppliesToTeacher(fund1Collective, { id: 'prof-1', role: 'fund1' }), true)
assert.equal(blockAppliesToTeacher(fund1Collective, { id: 'prof-2', role: 'fund2' }), false)

const individual = { ...collective, teacherId: 'prof-2', role: 'fund1' }
assert.equal(blockAppliesToTeacher(individual, { id: 'prof-2', role: 'fund2' }), true, 'bloqueio individual usa o professor')
assert.equal(blockAppliesToTeacher(individual, { id: 'prof-1', role: 'fund1' }), false)
assert.equal(blocksTeacherOnDate([individual], { id: 'prof-2', role: 'fund2' }, '2026-09-23T12:00:00.000Z'), individual)

assert.equal(
  appointmentStartUtc('2026-09-21T12:00:00.000Z', '14:20').toISOString(),
  '2026-09-21T17:20:00.000Z',
  'horário de Fortaleza deve ser convertido para UTC',
)

console.log('12 testes de regras de bloqueio passaram.')
