const test = require('node:test')
const assert = require('node:assert/strict')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/' })
global.window = dom.window; global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement; global.Event = dom.window.Event
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator })
global.IS_REACT_ACT_ENVIRONMENT = true
// JSDOM não implementa a renderização/foco nativos de <dialog>.
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
const React = require('react')
const { act } = React
const { createRoot } = require('react-dom/client')
const { fixture } = require('./block-api-fixture.cjs')
let root
test.afterEach(async () => { if (root) await act(async () => root.unmount()); root = null; document.getElementById('root').innerHTML = '' })
const buttons = () => [...document.querySelectorAll('button')]
const button = name => { const element = buttons().find(item => item.textContent.trim() === name); assert.ok(element, 'Botão: '+name); return element }
const input = label => {
  const element = [...document.querySelectorAll('label')].find(item => item.textContent.trim() === label)?.querySelector('input')
  assert.ok(element,'Campo: '+label);return element
}
async function click(element) { await act(async () => element.click()) }
async function fill(element, value) {
  assert.ok(element)
  await act(async () => {
    const prototype = element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype
    Object.getOwnPropertyDescriptor(prototype,'value').set.call(element,value)
    element.dispatchEvent(new dom.window.Event('input',{bubbles:true}));element.dispatchEvent(new dom.window.Event('change',{bubbles:true}))
  })
}
async function setup(configure = () => {}) {
  const f=fixture();configure(f);const posts=[];let refreshes=0
  global.fetch=async(url,options={})=>{
    if(url==='/api/bloqueios/opcoes')return f.routes.options.GET()
    if(url==='/api/bloqueios'&&options.method==='POST'){const body=JSON.parse(options.body);posts.push(body);return f.routes.blocks.POST(new Request('http://localhost/api/bloqueios',{method:'POST',headers:{'Content-Type':'application/json'},body:options.body}))}
    if(url==='/api/bloqueios')return f.routes.blocks.GET()
    if(url.startsWith('/api/bloqueios?'))return f.routes.blocks.DELETE(new Request('http://localhost'+url,{method:'DELETE'}))
    throw new Error('Requisição inesperada '+url)
  }
  const Component=f.load('components/secretaria/ScheduleBlocksPanel.tsx').default
  root=createRoot(document.getElementById('root'))
  await act(async()=>root.render(React.createElement(Component,{onAppointmentsChanged:()=>refreshes++})))
  await click(button('Bloquear datas'))
  return {f,posts,refreshes:()=>refreshes}
}
async function setDetails(f) {
  const date=f.state.future.toISOString().slice(0,10)
  await fill(input('Data inicial'),date);await fill(input('Data final'),date)
  await fill(document.querySelector('textarea'),'Semana de provas')
}

test('séries aparecem imediatamente com todos os professores e não permitem seleção vazia',async()=>{
  await setup();assert.ok(document.querySelector('dialog[open]'));assert.ok(input('Todos os professores').checked)
  assert.ok(input('1º Ano Fundamental'));assert.ok(input('5º Ano Fundamental'));assert.equal(button('Revisar bloqueio').disabled,true)
  await click(input('2º Ano Fundamental'));await click(input('3º Ano Fundamental'))
  assert.ok(input('2º Ano Fundamental').checked);assert.ok(input('3º Ano Fundamental').checked);assert.equal(input('1º Ano Fundamental').checked,false)
  assert.equal(button('Revisar bloqueio').disabled,false)
})
test('múltiplos professores + múltiplas séries chegam ao backend pela revisão',async()=>{
  const {f,posts,refreshes}=await setup();await setDetails(f)
  await click(input('2º Ano Fundamental'));await click(input('3º Ano Fundamental'));await click(input('Selecionar professores'))
  const teacher = name => [...document.querySelectorAll('.teacherList label')].find(item=>item.textContent.startsWith(name)).querySelector('input')
  assert.equal(button('Revisar bloqueio').disabled,true)
  await click(teacher('Ana Teste'));await click(teacher('Beatriz Teste'))
  await click(button('Revisar bloqueio'));assert.equal(posts.length,0)
  assert.match(document.querySelector('.review').textContent,/Ana Teste, Beatriz Teste/)
  await click(button('Confirmar bloqueio'));assert.equal(posts.length,1);assert.deepEqual(posts[0].teacherIds,['ana','bia']);assert.equal(posts[0].grades.length,2)
  assert.equal(f.state.blocks.length,2);assert.equal(refreshes(),1);assert.match(document.querySelector('[role=status]').textContent,/Bloqueio salvo/)
})
test('busca e marcar exibidos preservam professores já selecionados',async()=>{
  await setup();await click(input('Selecionar professores'))
  const search=document.querySelector('input[type=search]')
  await fill(search,'ANA');await click(button('Marcar exibidos'))
  await fill(search,'Beatriz');await click(button('Marcar exibidos'))
  await fill(search,'');assert.equal(document.querySelectorAll('.teacherList input:checked').length,2)
  await click(button('Limpar professores'));assert.equal(document.querySelectorAll('.teacherList input:checked').length,0)
})
test('trocar professores não apaga séries; todas menos 1º/infantil é possível',async()=>{
  await setup();await click(input('Todas as séries do meu acesso'));await click(input('Educação Infantil'));await click(input('1º Ano Fundamental'))
  assert.equal(document.querySelectorAll('.gradeGrid input:checked').length,4)
  await click(input('Selecionar professores'));await click(input('Todos os professores'))
  assert.equal(document.querySelectorAll('.gradeGrid input:checked').length,4)
})
test('erro na lista de bloqueios não esvazia professores e séries; retry recupera',async()=>{
  const {f}=await setup(f=>{f.state.failBlocks=true})
  assert.match(document.querySelector('[role=alert]').textContent,/migrate deploy/)
  await click(input('Selecionar professores'));assert.equal(document.querySelectorAll('.teacherList input').length,3)
  await click(input('2º Ano Fundamental'));assert.equal(button('Revisar bloqueio').disabled,true)
  f.state.failBlocks=false;await click(button('Tentar carregar bloqueios novamente'));assert.equal(document.querySelectorAll('[role=alert]').length,0)
})
test('erro de professores tem retry visível, sem sumir com séries',async()=>{
  const {f}=await setup(f=>{f.state.failTeachers=true})
  assert.ok(input('2º Ano Fundamental'));assert.equal(button('Revisar bloqueio').disabled,true)
  f.state.failTeachers=false;await click(button('Tentar carregar opções novamente'));await click(input('Selecionar professores'))
  assert.equal(document.querySelectorAll('.teacherList input').length,3)
})
test('voltar da revisão preserva escolhas; fechar/reabrir funciona',async()=>{
  const {f,posts}=await setup();await setDetails(f);await click(input('2º Ano Fundamental'));await click(button('Revisar bloqueio'))
  await click(button('Voltar e ajustar'));assert.ok(input('2º Ano Fundamental').checked);assert.equal(posts.length,0)
  await click(button('Fechar'));assert.equal(document.querySelector('dialog'),null);await click(button('Bloquear datas'));assert.ok(input('2º Ano Fundamental').checked)
})
