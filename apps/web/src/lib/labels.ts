/**
 * Rótulos PT-BR e tons visuais dos enums do domínio.
 * Fonte única para a interface: nenhuma tela deve exibir o valor cru do enum.
 */

export type Tone = 'slate' | 'green' | 'amber' | 'red' | 'blue';

export interface EnumEntry {
  label: string;
  tone: Tone;
}

type EnumMap = Record<string, EnumEntry>;

export const JOB_STATUS: EnumMap = {
  DRAFT: { label: 'Rascunho', tone: 'slate' },
  SCHEDULED: { label: 'Agendada', tone: 'slate' },
  CHECKED_IN: { label: 'Recebida', tone: 'blue' },
  IN_INSPECTION: { label: 'Em inspeção', tone: 'blue' },
  WAITING_APPROVAL: { label: 'Aguardando aprovação', tone: 'amber' },
  APPROVED: { label: 'Aprovada', tone: 'blue' },
  IN_PROGRESS: { label: 'Em execução', tone: 'blue' },
  WAITING_PARTS: { label: 'Aguardando peças', tone: 'amber' },
  COMPLETED: { label: 'Concluída', tone: 'green' },
  DELIVERED: { label: 'Entregue', tone: 'green' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
  LOCKED: { label: 'Fechada', tone: 'slate' },
};

export const JOB_TYPE: EnumMap = {
  INSPECTION: { label: 'Inspeção', tone: 'slate' },
  REPAIR: { label: 'Reparo', tone: 'slate' },
  SERVICE: { label: 'Serviço', tone: 'slate' },
};

export const APPOINTMENT_STATUS: EnumMap = {
  SCHEDULED: { label: 'Agendado', tone: 'slate' },
  CONFIRMED: { label: 'Confirmado', tone: 'blue' },
  CHECKED_IN: { label: 'Recebido', tone: 'blue' },
  COMPLETED: { label: 'Concluído', tone: 'green' },
  CANCELLED: { label: 'Cancelado', tone: 'red' },
  NO_SHOW: { label: 'Não compareceu', tone: 'amber' },
};

export const INSPECTION_STATUS: EnumMap = {
  PENDING: { label: 'Pendente', tone: 'slate' },
  IN_PROGRESS: { label: 'Em andamento', tone: 'blue' },
  COMPLETED: { label: 'Concluída', tone: 'green' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
};

export const INSPECTION_RESULT: EnumMap = {
  OK: { label: 'OK', tone: 'green' },
  ATTENTION: { label: 'Atenção', tone: 'amber' },
  REPAIR: { label: 'Reparar', tone: 'red' },
  NOT_INSPECTED: { label: 'Não inspecionado', tone: 'slate' },
  NOT_APPLICABLE: { label: 'Não se aplica', tone: 'slate' },
};

export const APPROVAL_STATUS: EnumMap = {
  NOT_REQUIRED: { label: 'Não requer', tone: 'slate' },
  PENDING: { label: 'Pendente', tone: 'amber' },
  APPROVED: { label: 'Aprovada', tone: 'green' },
  REJECTED: { label: 'Rejeitada', tone: 'red' },
};

export const QUOTATION_STATUS: EnumMap = {
  DRAFT: { label: 'Rascunho', tone: 'slate' },
  SENT: { label: 'Enviado', tone: 'blue' },
  APPROVED: { label: 'Aprovado', tone: 'green' },
  REJECTED: { label: 'Rejeitado', tone: 'red' },
  EXPIRED: { label: 'Expirado', tone: 'amber' },
  CONVERTED: { label: 'Faturado', tone: 'green' },
};

export const INVOICE_STATUS: EnumMap = {
  DRAFT: { label: 'Rascunho', tone: 'slate' },
  ISSUED: { label: 'Emitida', tone: 'blue' },
  PARTIALLY_PAID: { label: 'Paga parcialmente', tone: 'amber' },
  PAID: { label: 'Paga', tone: 'green' },
  OVERDUE: { label: 'Vencida', tone: 'red' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
};

export const PURCHASE_STATUS: EnumMap = {
  RECEIVED: { label: 'Recebida', tone: 'green' },
  CANCELLED: { label: 'Cancelada', tone: 'red' },
};

export const LINE_TYPE: EnumMap = {
  LABOR: { label: 'Mão de obra', tone: 'slate' },
  PART: { label: 'Peça', tone: 'slate' },
  SERVICE: { label: 'Serviço', tone: 'slate' },
  FEE: { label: 'Taxa', tone: 'slate' },
  CUSTOM: { label: 'Outro', tone: 'slate' },
};

export const PAYMENT_METHOD: EnumMap = {
  CASH: { label: 'Dinheiro', tone: 'slate' },
  CARD: { label: 'Cartão', tone: 'slate' },
  TRANSFER: { label: 'Transferência', tone: 'slate' },
  PIX: { label: 'Pix', tone: 'slate' },
  OTHER: { label: 'Outro', tone: 'slate' },
};

export const STOCK_MOVEMENT_TYPE: EnumMap = {
  INITIAL: { label: 'Saldo inicial', tone: 'slate' },
  PURCHASE: { label: 'Compra', tone: 'green' },
  ISSUE_TO_JOB: { label: 'Baixa para OS', tone: 'amber' },
  SALE: { label: 'Venda', tone: 'amber' },
  RETURN_IN: { label: 'Devolução', tone: 'green' },
  ADJUSTMENT: { label: 'Ajuste', tone: 'slate' },
  TRANSFER: { label: 'Transferência', tone: 'blue' },
};

export const CUSTOMER_TYPE: EnumMap = {
  INDIVIDUAL: { label: 'Pessoa física', tone: 'slate' },
  COMPANY: { label: 'Pessoa jurídica', tone: 'slate' },
};

/** Rótulo de um valor de enum; cai no valor cru só se o mapa não o conhecer. */
export function enumLabel(map: EnumMap, value: string | null | undefined): string {
  if (!value) return '-';
  return map[value]?.label ?? value;
}

export function enumTone(map: EnumMap, value: string | null | undefined): Tone {
  return (value && map[value]?.tone) || 'slate';
}

/** Opções `{ value, label }` para selects de filtro/formulário. */
export function enumOptions(map: EnumMap): { value: string; label: string }[] {
  return Object.entries(map).map(([value, entry]) => ({ value, label: entry.label }));
}
