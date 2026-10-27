
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
  if (!value) return ""
  return String(value)
    .replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18)
}


export function validateCNPJ(cnpj: string) {
  const c = String(cnpj).replace(/[^\d]/g, '')
  
  if (c.length !== 14) return false
  if (/^(\d)\1+$/.test(c)) return false

  let length = c.length - 2
  let numbers = c.substring(0, length)
  const digits = c.substring(length)
  let sum = 0
  let pos = length - 7

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(0))) return false

  length = length + 1
  numbers = c.substring(0, length)
  sum = 0
  pos = length - 7
  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--
    if (pos < 2) pos = 9
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11)
  if (result !== Number(digits.charAt(1))) return false

  return true
}

export function numberToExtensoBRL(valor: number): string {
  if (!valor || isNaN(valor)) return "zero reais";
  const unidades = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
  const dezenas10 = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
  const dezenas = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
  const centenas = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

  function triExtenso(n: number): string {
    if (n === 100) return "cem";
    let res = "";
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;
    if (c > 0) res += centenas[c];
    if (d === 1) {
      if (res) res += " e ";
      res += dezenas10[u];
    } else {
      if (d > 1) {
        if (res) res += " e ";
        res += dezenas[d];
      }
      if (u > 0) {
        if (res) res += " e ";
        res += unidades[u];
      }
    }
    return res;
  }

  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  if (inteiro === 0 && centavos === 0) return "zero reais";

  const partes: string[] = [];

  const milhoes = Math.floor(inteiro / 1000000);
  const restoMilhoes = inteiro % 1000000;
  if (milhoes > 0) {
    const extM = triExtenso(milhoes);
    partes.push(milhoes === 1 ? "um milhão" : `${extM} milhões`);
  }

  const milhares = Math.floor(restoMilhoes / 1000);
  const restoMilhares = restoMilhoes % 1000;
  if (milhares > 0) {
    const extK = triExtenso(milhares);
    partes.push(milhares === 1 ? "um mil" : `${extK} mil`);
  }

  if (restoMilhares > 0) {
    partes.push(triExtenso(restoMilhares));
  }

  let extensoInteiro = "";
  if (partes.length === 1) {
    extensoInteiro = partes[0];
  } else if (partes.length === 2) {
    extensoInteiro = `${partes[0]} e ${partes[1]}`;
  } else if (partes.length === 3) {
    extensoInteiro = `${partes[0]}, ${partes[1]} e ${partes[2]}`;
  }

  const moeda = inteiro === 1 ? "real" : "reais";
  let resultado = `${extensoInteiro} ${moeda}`;

  if (centavos > 0) {
    const extC = triExtenso(centavos);
    const centavoStr = centavos === 1 ? "centavo" : "centavos";
    resultado += ` e ${extC} ${centavoStr}`;
  }

  return resultado;
}

