const test = require('node:test')
const assert = require('node:assert/strict')
const { fixture } = require('./block-api-fixture.cjs')
const routePath = 'app/api/agendamentos/[id]/route.ts'
function setup(options) {
  const f = fixture(options)
  f.addAppointment('cancel-test', 'ana', f.state.grades[0])
  f.route = f.load(routePath)
  f.cancel = (body = { status: 'cancelled' }, id = 'cancel-test') => f.route.PATCH(new Request('http://localhost/api/agendamentos/' + id, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  }), { params: { id } })
  return f
}

test('salva o motivo separado do motivo da reunião e envia ao responsável correto', async () => {
  const f = setup(); const reason = 'A professora não atende a turma da sua filha.\nFaça um novo agendamento.'
  const res = await f.cancel({ status: 'cancelled', cancellationReason: '  ' + reason + '  ' }); const data = await res.json()
  assert.equal(res.status, 200); assert.equal(data.notificationSent, true)
  assert.equal(data.cancellationReason, reason); assert.equal(data.reason, 'Teste')
  assert.equal(f.state.appointments[0].status, 'cancelled'); assert.equal(f.state.appointments[0].cancellationReason, reason)
  assert.equal(f.state.sent.length, 1); assert.equal(f.state.sent[0].cancellationReason, reason)
  assert.equal(f.state.sent[0].parentEmail, f.state.appointments[0].parentEmail)
})
test('motivo é opcional: ausente, null, vazio e espaços mantêm o aviso padrão', async () => {
  for (const reason of [undefined, null, '', ' \n ']) {
    const f = setup(); const res = await f.cancel({ status: 'cancelled', cancellationReason: reason })
    assert.equal(res.status, 200); assert.equal(f.state.appointments[0].cancellationReason, null)
    assert.equal(f.state.sent[0].cancellationReason, undefined)
  }
})
test('rejeita motivo inválido ou longo antes de gravar e enviar', async () => {
  for (const reason of [42, {}, ['texto'], true, 'a'.repeat(501)]) {
    const f = setup(); assert.equal((await f.cancel({ status: 'cancelled', cancellationReason: reason })).status, 400)
    assert.equal(f.state.appointments[0].status, 'confirmed'); assert.equal(f.state.sent.length, 0); assert.equal(f.state.writes, 0)
  }
  const f = setup(); assert.equal((await f.cancel({ status: 'cancelled', cancellationReason: 'a'.repeat(500) })).status, 200)
})
test('não aceita JSON inválido, corpo inválido nem outras alterações de status', async () => {
  const f = setup()
  for (const body of [null, [], {}, { status: 'confirmed' }]) assert.equal((await f.cancel(body)).status, 400)
  const res = await f.route.PATCH(new Request('http://localhost/', { method: 'PATCH', body: '{' }), { params: { id: 'cancel-test' } })
  assert.equal(res.status, 400); assert.equal(f.state.writes, 0)
})
test('exige sessão e respeita o mesmo escopo de séries da listagem', async () => {
  const f = setup(); f.state.authenticated = false; assert.equal((await f.cancel()).status, 401)
  f.state.authenticated = true; f.state.role = 'fund2'; assert.equal((await f.cancel()).status, 403)
  f.state.role = 'invalid'; assert.equal((await f.cancel()).status, 403)
  f.state.role = 'geral'; assert.equal((await f.cancel()).status, 200)
})
test('permite corrigir professor errado mesmo se ele pertencer a outro segmento', async () => {
  const f = setup(); f.addAppointment('wrong-teacher', 'outro', f.state.grades[0])
  assert.equal((await f.cancel({ status: 'cancelled', cancellationReason: 'Professor de outra turma.' }, 'wrong-teacher')).status, 200)
})
test('agendamento inexistente retorna 404 sem gravação', async () => {
  const f = setup(); assert.equal((await f.cancel({ status: 'cancelled' }, 'missing')).status, 404); assert.equal(f.state.writes, 0)
})
test('cliques/requisições concorrentes cancelam e notificam uma única vez', async () => {
  const f = setup(); const responses = await Promise.all([f.cancel({ status: 'cancelled', cancellationReason: 'Primeiro' }), f.cancel({ status: 'cancelled', cancellationReason: 'Segundo' })])
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]); assert.equal(f.state.sent.length, 1)
  assert.equal(f.state.appointments[0].cancellationReason, 'Primeiro')
})
test('espera o resultado do e-mail antes de responder', async () => {
  let finish; let started = false
  const f = setup({ mocks: { '@/lib/email': { sendCancellationToParent: () => { started = true; return new Promise(resolve => { finish = resolve }) } } } })
  let completed = false; const pending = f.cancel().then(res => { completed = true; return res })
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(started, true); assert.equal(completed, false); finish(true)
  assert.equal((await pending).status, 200)
})
test('falha no envio não desfaz o cancelamento nem anuncia envio concluído', async () => {
  for (const throws of [false, true]) {
    const f = setup({ mocks: { '@/lib/email': { sendCancellationToParent: async () => { if (throws) throw new Error('mail failed'); return false } } } })
    const response = await f.cancel({ status: 'cancelled', cancellationReason: 'Professora de outra turma.' })
    assert.equal(response.status, 200); assert.equal((await response.json()).notificationSent, false)
    assert.equal(f.state.appointments[0].status, 'cancelled'); assert.equal(f.state.appointments[0].cancellationReason, 'Professora de outra turma.')
  }
})
test('falha na gravação não envia e-mail nem cancela o registro', async () => {
  const f = setup(); f.state.failAppointmentUpdate = 'P2022'; const res = await f.cancel()
  assert.equal(res.status, 500); assert.match((await res.json()).error, /atualização/)
  assert.equal(f.state.appointments[0].status, 'confirmed'); assert.equal(f.state.sent.length, 0)
})
test('bloqueio de período também preserva o motivo nos agendamentos cancelados', async () => {
  const f = setup(); const date = f.state.future.toISOString().slice(0, 10)
  const res = await f.routes.blocks.POST(new Request('http://localhost/api/bloqueios', { method: 'POST', body: JSON.stringify({ startDate: date, endDate: date, reason: 'Semana de provas', teacherScope: 'all', gradeScope: 'all' }) }))
  assert.equal(res.status, 201); assert.equal(f.state.appointments[0].cancellationReason, 'Semana de provas')
})

test('e-mail real inclui motivo no HTML e texto simples, escapa HTML e mantém quebras de linha', async () => {
  const sent = []
  const f = fixture({ mocks: { nodemailer: { createTransport: () => ({ sendMail: async mail => { sent.push(mail); return { accepted: ['teste@example.invalid'] } } }) } } })
  const email = f.load('lib/email.ts')
  const data = { parentName: 'Responsável', parentEmail: 'teste@example.invalid', studentName: 'Aluna', studentGrade: '1º Ano Fundamental', teacherName: 'Ana', subject: 'Português', date: f.state.future.toISOString(), startTime: '13:00' }
  const reason = 'Professora de outra turma.\n<b>Reagendar</b> & conferir.'
  assert.equal(await email.sendCancellationToParent({ ...data, cancellationReason: reason }), true)
  assert.match(sent[0].html, /Professora de outra turma\.<br>&lt;b&gt;Reagendar&lt;\/b&gt; &amp; conferir\./)
  assert.equal(sent[0].html.includes('<b>Reagendar</b>'), false); assert.ok(sent[0].text.includes(reason))
  await email.sendCancellationToParent(data)
  assert.equal(sent[1].html.includes('Motivo do cancelamento'), false); assert.equal(sent[1].text.includes('Motivo do cancelamento'), false)
})
test('SMTP sem destinatário aceito não é reportado como enviado', async () => {
  const f = fixture({ mocks: { nodemailer: { createTransport: () => ({ sendMail: async () => ({ accepted: [] }) }) } } })
  assert.equal(await f.load('lib/email.ts').sendCancellationToParent({ parentName: 'Teste', parentEmail: 'teste@example.invalid', studentName: 'Aluna', studentGrade: '1º Ano Fundamental', teacherName: 'Ana', subject: 'Português', date: f.state.future.toISOString(), startTime: '13:00' }), false)
})
