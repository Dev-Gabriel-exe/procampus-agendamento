// Regras de cobrança da recuperação. O tipo (normal/paralela) é independente
// da cobrança: uma recuperação paralela pode ser gratuita ou paga.

export const FUND1_GRADES = [
  'Educação Infantil',
  '1º Ano Fundamental',
  '2º Ano Fundamental',
  '3º Ano Fundamental',
  '4º Ano Fundamental',
  '5º Ano Fundamental',
] as const

export const DEFAULT_PAID_PRICE_CENTS = 3000

export function isFund1Grade(grade: string): boolean {
  return (FUND1_GRADES as readonly string[]).includes(grade)
}

export function defaultRecoveryBilling(grade: string): { isFree: boolean; priceCents: number } {
  return isFund1Grade(grade)
    ? { isFree: true, priceCents: 0 }
    : { isFree: false, priceCents: DEFAULT_PAID_PRICE_CENTS }
}

/** Aceita valor em centavos (API) ou valor decimal textual (formulários). */
export function parsePriceCents(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : Math.round(value * 100)
  }
  if (typeof value !== 'string' || !value.trim()) return null

  const normalized = value.trim().replace(/R\$\s?/gi, '').replace(/\./g, '').replace(',', '.')
  const parsed = Number(normalized)
  if (!Number.isFinite(parsed)) return null
  return Math.round(parsed * 100)
}

export function normalizeRecoveryBilling(
  grade: string,
  input: { isFree?: unknown; priceCents?: unknown; price?: unknown } = {},
): { isFree: boolean; priceCents: number } {
  const fallback = defaultRecoveryBilling(grade)
  const isFree = typeof input.isFree === 'boolean' ? input.isFree : fallback.isFree
  if (isFree) return { isFree: true, priceCents: 0 }

  const parsed = parsePriceCents(input.priceCents ?? input.price)
  return {
    isFree: false,
    priceCents: parsed == null ? fallback.priceCents : parsed,
  }
}

export function formatRecoveryPrice(priceCents: number): string {
  return (Math.max(0, priceCents) / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

/** Soma o valor de cada horário pago selecionado pelo responsável. */
export function calculateRecoveryTotalCents(
  slots: Array<{ isFree?: boolean; priceCents?: number }>,
  fallbackPriceCents = DEFAULT_PAID_PRICE_CENTS,
): number {
  return slots.reduce((total, slot) => {
    if (slot.isFree === true) return total
    const price = Number.isInteger(slot.priceCents) && (slot.priceCents as number) >= 0
      ? (slot.priceCents as number)
      : fallbackPriceCents
    return total + price
  }, 0)
}
