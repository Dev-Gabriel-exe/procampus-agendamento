import assert from 'node:assert/strict'
import test from 'node:test'
import {
  calculateRecoveryTotalCents,
  defaultRecoveryBilling,
  formatRecoveryPrice,
  normalizeRecoveryBilling,
} from '../lib/recovery-pricing'

test('Fundamental I começa gratuito e Fundamental II começa pago', () => {
  assert.deepEqual(defaultRecoveryBilling('2º Ano Fundamental'), { isFree: true, priceCents: 0 })
  assert.deepEqual(defaultRecoveryBilling('6º Ano Fundamental'), { isFree: false, priceCents: 3000 })
})

test('Paralela não força gratuidade', () => {
  assert.deepEqual(normalizeRecoveryBilling('6º Ano Fundamental', { isFree: false, price: '30,00' }), {
    isFree: false,
    priceCents: 3000,
  })
})

test('gratuidade zera o valor informado', () => {
  assert.deepEqual(normalizeRecoveryBilling('6º Ano Fundamental', { isFree: true, price: '999,00' }), {
    isFree: true,
    priceCents: 0,
  })
})

test('formata o valor para a tela e para o e-mail', () => {
  assert.equal(formatRecoveryPrice(5590), 'R$ 55,90')
})

test('soma uma cobrança por disciplina paga selecionada', () => {
  assert.equal(calculateRecoveryTotalCents([
    { isFree: false, priceCents: 3000 },
    { isFree: false, priceCents: 3000 },
    { isFree: true, priceCents: 0 },
  ]), 6000)
  assert.equal(formatRecoveryPrice(6000), 'R$ 60,00')
})
