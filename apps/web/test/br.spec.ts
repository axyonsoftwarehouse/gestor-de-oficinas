import { describe, expect, it } from 'vitest';
import {
  documentError,
  isValidCnpj,
  isValidCpf,
  isValidPlate,
  maskCep,
  maskDocument,
  maskPhone,
  maskPlate,
  phoneError,
} from '../src/lib/br';

describe('máscaras BR', () => {
  it('formata CPF e passa a CNPJ a partir do 12º dígito', () => {
    expect(maskDocument('52998224725')).toBe('529.982.247-25');
    expect(maskDocument('11222333000181')).toBe('11.222.333/0001-81');
    expect(maskDocument('529.982')).toBe('529.982');
  });

  it('formata telefone fixo e celular', () => {
    expect(maskPhone('1133334444')).toBe('(11) 3333-4444');
    expect(maskPhone('11987654321')).toBe('(11) 98765-4321');
  });

  it('formata CEP e placa', () => {
    expect(maskCep('01310100')).toBe('01310-100');
    expect(maskPlate('abc-1d23')).toBe('ABC1D23');
  });
});

describe('validações BR', () => {
  it('valida dígitos verificadores de CPF', () => {
    expect(isValidCpf('529.982.247-25')).toBe(true);
    expect(isValidCpf('529.982.247-24')).toBe(false);
    expect(isValidCpf('111.111.111-11')).toBe(false);
  });

  it('valida dígitos verificadores de CNPJ', () => {
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true);
    expect(isValidCnpj('11.222.333/0001-80')).toBe(false);
  });

  it('aceita placa antiga e Mercosul', () => {
    expect(isValidPlate('ABC1234')).toBe(true);
    expect(isValidPlate('ABC1D23')).toBe(true);
    expect(isValidPlate('AB12345')).toBe(false);
  });

  it('campos vazios não geram erro (são opcionais)', () => {
    expect(documentError('')).toBe('');
    expect(phoneError('')).toBe('');
    expect(phoneError('(11) 9876')).toBe('Telefone incompleto');
  });
});
