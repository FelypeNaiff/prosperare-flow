import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatCNPJ(value: string) {
  return value
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}

export function validateCNPJ(cnpj: string) {
  const b = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const c = String(cnpj).replace(/[^\d]/g, '')
  
  if (c.length !== 14) return false
  if (/0{14}/.test(c)) return false

  let n = 0
  for (let i = 0; i < 12; i++) n += parseInt(c[i]) * b[i + 1]
  let r = n % 11
  if (parseInt(c[12]) !== (r < 2 ? 0 : 11 - r)) return false

  n = 0
  for (let i = 0; i <= 12; i++) n += parseInt(c[i]) * b[i]
  r = n % 11
  if (parseInt(c[13]) !== (r < 2 ? 0 : 11 - r)) return false

  return true
}
