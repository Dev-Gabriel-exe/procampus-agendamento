// lib/masks.ts
// Utilitários de máscara reutilizáveis em todo o projeto

/** Telefone nacional: (86) 99999-9999 */
export function maskPhoneBr(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2)  return `(${d}`
  if (d.length <= 7)  return `(${d.slice(0,2)}) ${d.slice(2)}`
  return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
}

/** Telefone internacional: +55 (86) 99999-9999 */
export function maskPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 13)
  if (d.length === 0) return ''
  if (d.length <= 2)  return `+${d}`
  if (d.length <= 4)  return `+${d.slice(0,2)} (${d.slice(2)}`
  if (d.length <= 9)  return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4)}`
  return `+${d.slice(0,2)} (${d.slice(2,4)}) ${d.slice(4,9)}-${d.slice(9)}`
}

/** Retorna só os dígitos (para enviar ao backend) */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

/** Valida e-mail básico */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}