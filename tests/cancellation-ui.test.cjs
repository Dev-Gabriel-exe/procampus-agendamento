const test = require('node:test')
const assert = require('node:assert/strict')
const { JSDOM } = require('jsdom')
const dom = new JSDOM('<!doctype html><html><body><button id="trigger">Cancelar</button><div id="root"></div></body></html>', { url: 'http://localhost/' })
global.window = dom.window; global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement; global.Event = dom.window.Event
Object.defineProperty(global, 'navigator', { configurable: true, value: dom.window.navigator })
global.IS_REACT_ACT_ENVIRONMENT = true
dom.window.HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', '') }
const React = require('react'); const { act } = React; const { createRoot } = require('react-dom/client')
const { fixture } = require('./block-api-fixture.cjs')
let root
test.afterEach(async () => { if (root) await act(async () => root.unmount()); root = null; document.getElementById('root').innerHTML = '' })
const button = name => { const element = [...document.querySelectorAll('#root button')].find(item => item.textContent.trim() === name); assert.ok(element, name); return element }
async function click(element) { await act(async () => element.click()) }
async function fill(value) { await act(async () => {
  const element = document.querySelector('textarea'); Object.getOwnPropertyDescriptor(dom.window.HTMLTextAreaElement.prototype, 'value').set.call(element, value)
  element.dispatchEvent(new dom.window.Event('input', { bubbles: true })); element.dispatchEvent(new dom.window.Event('change', { bubbles: true }))
}) }
async function setup(configure = () => {}) {
  const f = fixture(); f.addAppointment('ui', 'ana', f.state.grades[0]); configure(f)
  const route = f.load('app/api/agendamentos/[id]/route.ts'); const posts = []; let refreshes = 0; let closes = 0
  global.fetch = async (url, options) => { posts.push(JSON.parse(options.body)); return route.PATCH(new Request('http://localhost' + url, options), { params: { id: 'ui' } }) }
  const Component = f.load('components/secretaria/CancelAppointmentModal.tsx').default
  document.getElementById('trigger').focus()
  root = createRoot(document.getElementById('root'))
  await act(async () => root.render(React.createElement(Component, { appointment: { ...f.state.appointments[0] }, onClose: () => closes++, onCancelled: () => refreshes++ })))
  return { f, posts, refreshes: () => refreshes, closes: () => closes }
}

test('abrir e voltar não cancela; modal identifica aluno, professora e destinatário', async () => {
  const s = await setup(); assert.ok(document.querySelector('dialog[open]'))
  assert.match(document.querySelector('dl').textContent, /Ana Teste/); assert.match(document.querySelector('dl').textContent, /1º Ano Fundamental/)
  assert.match(document.querySelector('form').textContent, /teste@example.invalid/)
  assert.equal(document.querySelector('textarea').required, false); assert.equal(document.querySelector('textarea').maxLength, 500)
  await click(button('Voltar')); assert.equal(s.closes(), 1); assert.equal(s.posts.length, 0); assert.equal(s.f.state.appointments[0].status, 'confirmed')
})
test('cancelar sem motivo é permitido e informa o resultado do envio', async () => {
  const s = await setup(); await click(button('Confirmar cancelamento'))
  assert.equal(s.posts[0].cancellationReason, null); assert.equal(s.refreshes(), 1)
  assert.match(document.querySelector('[role=status]').textContent, /Aviso enviado por e-mail/)
  assert.match(document.querySelector('[role=status]').textContent, /não confirma que o responsável leu/)
  assert.equal(document.querySelector('textarea'), null); await click(button('Concluir')); assert.equal(s.closes(), 1)
})
test('texto informado chega ao banco, e-mail e resumo final sem substituir o motivo original', async () => {
  const s = await setup(); await fill('  Professora de outra turma.  '); await click(button('Confirmar cancelamento'))
  assert.equal(s.posts[0].cancellationReason, 'Professora de outra turma.'); assert.equal(s.f.state.sent[0].cancellationReason, 'Professora de outra turma.')
  assert.match(document.querySelector('.savedReason').textContent, /Professora de outra turma/); assert.equal(s.f.state.appointments[0].reason, 'Teste')
})
test('falha de e-mail mantém cancelamento e orienta contato pelo telefone', async () => {
  const s = await setup(f => { f.state.failEmail = true }); await fill('Professora de outra turma.'); await click(button('Confirmar cancelamento'))
  const message = document.querySelector('[role=status]').textContent
  assert.match(message, /não foi possível confirmar o envio/); assert.match(message, /telefone/); assert.equal(s.f.state.appointments[0].status, 'cancelled')
  assert.equal(document.querySelector('[role=alert]'), null); assert.equal(s.refreshes(), 1)
})
test('erro da API preserva o texto e permite tentar novamente sem falso sucesso', async () => {
  const s = await setup(f => { f.state.failAppointmentUpdate = 'P2022' }); await fill('Professora de outra turma.'); await click(button('Confirmar cancelamento'))
  assert.match(document.querySelector('[role=alert]').textContent, /atualização/); assert.equal(document.querySelector('textarea').value, 'Professora de outra turma.')
  assert.equal(s.refreshes(), 0); assert.equal(s.f.state.appointments[0].status, 'confirmed')
  s.f.state.failAppointmentUpdate = false; await click(button('Confirmar cancelamento')); assert.equal(s.refreshes(), 1)
})
test('envio pendente impede clique duplicado e fechamento acidental', async () => {
  const s = await setup(); let finish
  global.fetch = async () => new Promise(resolve => { finish = resolve })
  await click(button('Confirmar cancelamento')); assert.equal(button('Voltar').disabled, true); assert.equal(document.querySelector('textarea').disabled, true)
  await act(async () => { document.querySelector('dialog').dispatchEvent(new dom.window.Event('cancel', { cancelable: true })) })
  assert.equal(s.closes(), 0)
  await act(async () => finish(new Response(JSON.stringify({ status: 'cancelled', notificationSent: true }), { status: 200 })))
  assert.equal(s.refreshes(), 1)
})
test('fechar libera a rolagem e restaura o foco no botão original', async () => {
  await setup(); assert.equal(document.body.style.overflow, 'hidden')
  await act(async () => root.unmount()); root = null
  assert.equal(document.body.style.overflow, ''); assert.equal(document.activeElement.id, 'trigger')
})
test('cartão cancelado exibe motivo persistido; antigos mostram não informado', () => {
  const { renderToStaticMarkup } = require('react-dom/server')
  // A animação não faz parte desta verificação de texto; mantém o HTML do cartão real.
  const f = fixture({ mocks: { 'framer-motion': {
    AnimatePresence: React.Fragment,
    motion: { div: ({ layout, initial, animate, exit, transition, whileHover, children, ...props }) => React.createElement('div', props, children) },
  } } }); f.addAppointment('card', 'ana', f.state.grades[0], { status: 'cancelled', cancellationReason: 'Professora de outra turma.' })
  const Card = f.load('components/secretaria/AgendamentoCard.tsx').default
  const render = () => renderToStaticMarkup(React.createElement(Card, { appt: f.state.appointments[0], onCancel: () => {} }))
  assert.match(render(), /Motivo do cancelamento/); assert.match(render(), /Professora de outra turma\./)
  f.state.appointments[0].cancellationReason = null; assert.match(render(), /Não informado/)
})
