/**
 * Máscaras e validações de dados brasileiros para os formulários.
 * Os valores são guardados já formatados (como no seed), exceto a placa,
 * que fica em maiúsculas sem hífen (padrão Mercosul e antigo: ABC1D23 / ABC1234).
 */

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

function apply(digits: string, pattern: string): string {
  let out = '';
  let index = 0;
  for (const char of pattern) {
    if (index >= digits.length) break;
    if (char === '0') {
      out += digits[index];
      index += 1;
    } else {
      out += char;
    }
  }
  return out;
}

export function maskCpf(value: string): string {
  return apply(onlyDigits(value).slice(0, 11), '000.000.000-00');
}

export function maskCnpj(value: string): string {
  return apply(onlyDigits(value).slice(0, 14), '00.000.000/0000-00');
}

/** CPF até 11 dígitos; a partir do 12º vira CNPJ. */
export function maskDocument(value: string): string {
  return onlyDigits(value).length > 11 ? maskCnpj(value) : maskCpf(value);
}

export function maskPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  return digits.length > 10
    ? apply(digits, '(00) 00000-0000')
    : apply(digits, '(00) 0000-0000');
}

export function maskCep(value: string): string {
  return apply(onlyDigits(value).slice(0, 8), '00000-000');
}

export function maskPlate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 7);
}

function allSame(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

export function isValidCpf(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 11 || allSame(digits)) return false;
  for (const size of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Number(digits[i]) * (size + 1 - i);
    const check = ((sum * 10) % 11) % 10;
    if (check !== Number(digits[size])) return false;
  }
  return true;
}

export function isValidCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || allSame(digits)) return false;
  const weights = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  for (const size of [12, 13]) {
    let sum = 0;
    for (let i = 0; i < size; i += 1) sum += Number(digits[i]) * weights[i + 13 - size]!;
    const rest = sum % 11;
    const check = rest < 2 ? 0 : 11 - rest;
    if (check !== Number(digits[size])) return false;
  }
  return true;
}

export function isValidPlate(value: string): boolean {
  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(maskPlate(value));
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Mensagens de erro por campo (vazio = opcional, sem erro).
 * `kind` do documento: 'cpf', 'cnpj' ou 'any' (decide pelo tamanho).
 */
export function documentError(value: string, kind: 'cpf' | 'cnpj' | 'any' = 'any'): string {
  const digits = onlyDigits(value);
  if (!digits) return '';
  const asCnpj = kind === 'cnpj' || (kind === 'any' && digits.length > 11);
  if (asCnpj) return isValidCnpj(digits) ? '' : 'CNPJ inválido';
  return isValidCpf(digits) ? '' : 'CPF inválido';
}

export function phoneError(value: string): string {
  const length = onlyDigits(value).length;
  if (!length) return '';
  return length === 10 || length === 11 ? '' : 'Telefone incompleto';
}

export function cepError(value: string): string {
  const length = onlyDigits(value).length;
  if (!length) return '';
  return length === 8 ? '' : 'CEP incompleto';
}

export function plateError(value: string): string {
  if (!value) return '';
  return isValidPlate(value) ? '' : 'Placa inválida (ex.: ABC1D23 ou ABC1234)';
}

export function emailError(value: string): string {
  if (!value.trim()) return '';
  return isValidEmail(value) ? '' : 'E-mail inválido';
}

type Rule = (value: string) => string;

/**
 * Valida só os campos que o usuário alterou: dados antigos (importados ou de
 * demonstração) fora do padrão não impedem editar o restante do cadastro.
 */
export function validateChanged<T extends object>(
  form: T,
  initial: T,
  rules: Partial<Record<keyof T, Rule>>,
): { errors: Partial<Record<keyof T, string>>; valid: boolean } {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(rules) as (keyof T)[]) {
    const rule = rules[key];
    const value = String(form[key] ?? '');
    if (rule && value !== String(initial[key] ?? '')) {
      const message = rule(value);
      if (message) errors[key] = message;
    }
  }
  return { errors, valid: Object.keys(errors).length === 0 };
}
