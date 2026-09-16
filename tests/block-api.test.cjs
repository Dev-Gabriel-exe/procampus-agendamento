const test = require('node:test')
const assert = require('node:assert/strict')
const { fixture } = require('./block-api-fixture.cjs')
function payload(f, extra = {}) { return { startDate: f.state.future.toISOString().slice(0,10), endDate: f.state.future.toISOString().slice(0,10), teacherScope: 'selected', teacherIds: ['ana', 'bia'], gradeScope: 'selected', grades: f.state.grades.slice(1), reason: 'Semana de provas', ...extra } }
function request(body, url = 'http://localhost/api/bloqueios') { return new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) }

test('opções independem dos bloqueios e oferecem todas as séries do acesso', async () => {
  const f = fixture(); f.state.failBlocks = true
  const options = await f.routes.options.GET(); const data = await options.json()
  assert.equal(options.status, 200); assert.equal(data.teachers.length, 3); assert.equal(data.grades.length, 6)
  assert.ok(data.grades.includes('1º Ano Fundamental'))
  const blocks = await f.routes.blocks.GET(); assert.equal(blocks.status, 500); assert.match((await blocks.json()).error, /migrate deploy/)
})
test('falha de professores retorna erro explícito e preserva séries', async () => {
  const f = fixture(); f.state.failTeachers = true
  const response = await f.routes.options.GET(); assert.equal(response.status, 503); assert.equal((await response.json()).grades.length, 6)
})
test('duas professoras e 2º–5º cancelam apenas os agendamentos correspondentes', async () => {
  const f = fixture()
  for (const teacher of ['ana','bia','caio','outro']) for (const grade of f.state.grades) f.addAppointment(teacher + grade, teacher, grade)
  f.addAppointment('passado','ana',f.state.grades[1],{date:new Date('2020-01-01T12:00:00Z')})
  const response = await f.routes.blocks.POST(request(payload(f))); const data = await response.json()
  assert.equal(response.status,201); assert.equal(data.createdCount,2); assert.equal(data.cancelledCount,8); assert.equal(f.state.sent.length,8)
  assert.equal(f.state.appointments.filter(a=>a.status==='cancelled').length,8)
  assert.equal(f.state.appointments.find(a=>a.id==='ana1º Ano Fundamental').status,'confirmed')
  assert.ok(f.state.appointments.filter(a=>a.availability.teacherId==='caio').every(a=>a.status==='confirmed'))
  assert.equal(f.state.appointments.find(a=>a.id==='passado').status,'confirmed')
})
test('todos os professores com séries específicas não cancelam outra série ou nível',async()=>{
  const f=fixture(); f.addAppointment('a','ana',f.state.grades[1]); f.addAppointment('b','bia',f.state.grades[0]); f.addAppointment('c','outro',f.state.grades[1])
  const response=await f.routes.blocks.POST(request(payload(f,{teacherScope:'all',teacherIds:[]})))
  assert.equal(response.status,201); assert.equal((await response.json()).cancelledCount,1); assert.equal(f.state.blocks[0].teacherId,null)
})
test('professores selecionados com todas as séries',async()=>{
  const f=fixture(); f.addAppointment('a','ana',f.state.grades[0]); f.addAppointment('b','bia',f.state.grades[4]); f.addAppointment('c','caio',f.state.grades[4])
  const response=await f.routes.blocks.POST(request(payload(f,{gradeScope:'all',grades:[]})))
  assert.equal(response.status,201); assert.equal((await response.json()).cancelledCount,2)
})
for (const [name,extra,status] of [
  ['professores vazios',{teacherIds:[]},400], ['séries vazias',{grades:[]},400],
  ['série fora do acesso',{grades:['6º Ano Fundamental']},403], ['professor fora do acesso',{teacherIds:['outro']},403],
  ['professor inexistente',{teacherIds:['inexistente']},400], ['professor não é lista',{teacherIds:'ana'},400],
  ['escopo inconsistente',{teacherScope:'all'},400], ['série inválida',{grades:[null]},400],
]) test(name,async()=>{const f=fixture();const response=await f.routes.blocks.POST(request(payload(f,extra)));assert.equal(response.status,status);assert.equal(f.state.writes,0)})
test('legado teacherId único e lista vazia de séries continua aceito',async()=>{
  const f=fixture();const body=payload(f);delete body.teacherScope;delete body.teacherIds;delete body.gradeScope;body.teacherId='ana';body.grades=[]
  assert.equal((await f.routes.blocks.POST(request(body))).status,201);assert.equal(f.state.blocks[0].teacherId,'ana')
})
test('duplicados não criam registros nem cancelam de novo',async()=>{
  const f=fixture();const body=payload(f,{teacherIds:['bia','ana','ana']});assert.equal((await f.routes.blocks.POST(request(body))).status,201)
  assert.equal(f.state.blocks.length,2);assert.equal((await f.routes.blocks.POST(request(payload(f)))).status,409);assert.equal(f.state.blocks.length,2)
})
test('falha no segundo professor reverte a transação inteira',async()=>{
  const f=fixture();f.state.failCreateAt=2;f.addAppointment('a','ana',f.state.grades[1]);assert.equal((await f.routes.blocks.POST(request(payload(f)))).status,500)
  assert.equal(f.state.blocks.length,0);assert.equal(f.state.appointments[0].status,'confirmed');assert.equal(f.state.sent.length,0)
})
test('falha de email não declara que a gravação falhou',async()=>{
  const f=fixture();f.state.failEmail=true;f.addAppointment('a','ana',f.state.grades[1]);const response=await f.routes.blocks.POST(request(payload(f)));const data=await response.json()
  assert.equal(response.status,201);assert.equal(data.notifiedCount,0);assert.equal(data.cancelledCount,1)
})
test('busca de horários libera 1º ano e bloqueia 2º apenas dos professores marcados',async()=>{
  const f=fixture();await f.routes.blocks.POST(request(payload(f)))
  const get=async grade=>(await f.routes.availability.GET(new Request('http://localhost/api/disponibilidade?subject=Portugu%C3%AAs&grade='+encodeURIComponent(grade)))).json()
  const first=await get(f.state.grades[0]);assert.equal(first.blockedPeriods.length,0);assert.ok(first.slots.some(s=>s.teacherId==='ana'))
  const second=await get(f.state.grades[1]);assert.equal(second.blockedPeriods.length,2);assert.ok(!second.slots.some(s=>['ana','bia'].includes(s.teacherId)));assert.ok(second.slots.some(s=>s.teacherId==='caio'))
})
test('POST de agendamento revalida bloqueio para tela antiga e mantém 1º ano',async()=>{
  const f=fixture();await f.routes.blocks.POST(request(payload(f)))
  const booking={availabilityId:'avail-ana',date:f.state.future.toISOString(),startTime:'13:00',endTime:'13:20',studentName:'Aluno teste',studentGrade:f.state.grades[1],parentName:'Responsável',parentEmail:'example@example.invalid',parentPhone:'000',reason:'Teste',subjectName:'Português'}
  assert.equal((await f.routes.bookings.POST(request(booking))).status,409)
  assert.equal((await f.routes.bookings.POST(request({...booking,studentGrade:f.state.grades[0]}))).status,201)
})
test('sem sessão não pode consultar opções nem criar bloqueio',async()=>{
  const f=fixture();f.state.authenticated=false;assert.equal((await f.routes.options.GET()).status,401);assert.equal((await f.routes.blocks.POST(request(payload(f)))).status,401)
})
test('desbloquear não restaura cancelamentos e respeita propriedade',async()=>{
  const f=fixture();f.addAppointment('a','ana',f.state.grades[1]);await f.routes.blocks.POST(request(payload(f)))
  const id=f.state.blocks[0].id;f.state.role='fund2';assert.equal((await f.routes.blocks.DELETE(new Request('http://localhost/api/bloqueios?id='+id))).status,403)
  f.state.role='fund1';assert.equal((await f.routes.blocks.DELETE(new Request('http://localhost/api/bloqueios?id='+id))).status,200);assert.equal(f.state.blocks.length,1);assert.equal(f.state.appointments[0].status,'cancelled')
})
