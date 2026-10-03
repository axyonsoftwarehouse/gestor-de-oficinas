import { DiscountType, Prisma } from '@prisma/client';
import { getDb } from '../db/prisma';

export interface LineAmountInput {
  quantity: number;
  unitPrice: number;
  discountType?: DiscountType | null;
  discountValue: number;
  taxIds?: string[];
}

/** Cálculo central de valores de linha (base, desconto, impostos e total). */
export async function calculateLine(input: LineAmountInput) {
  const quantity = new Prisma.Decimal(input.quantity);
  const unitPrice = new Prisma.Decimal(input.unitPrice);
  const gross = quantity.mul(unitPrice);

  const discountValue = new Prisma.Decimal(input.discountValue);
  const discount =
    input.discountType === 'PERCENT'
      ? gross.mul(discountValue).div(100)
      : input.discountType === 'AMOUNT'
        ? discountValue
        : new Prisma.Decimal(0);

  const base = gross.minus(discount);

  const taxes = input.taxIds?.length
    ? await getDb().tax.findMany({
        where: { id: { in: input.taxIds }, isActive: true },
      })
    : [];

  let taxAmount = new Prisma.Decimal(0);
  const taxRows = taxes.map((tax) => {
    const rate = new Prisma.Decimal(tax.rate);
    const amount = tax.type === 'PERCENT' ? base.mul(rate).div(100) : rate;
    taxAmount = taxAmount.plus(amount);
    return { taxId: tax.id, rate, base, amount };
  });

  return {
    quantity,
    unitPrice,
    discountValue,
    base,
    taxAmount,
    total: base.plus(taxAmount),
    taxRows,
  };
}
