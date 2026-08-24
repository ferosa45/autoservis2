/**
 * Prisma Decimal je instance třídy (decimal.js), ne "plain object" -
 * stejně jako reference na React komponentu ji nejde poslat ze Server
 * Component do Client Component jako prop. Než se JobItem/InvoiceItem
 * (cokoliv s Decimal poli) pošle do klientské komponenty, musí se
 * převést na obyčejné číslo touto funkcí.
 */
export type SerializedJobItem = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
};

export function serializeJobItems<
  T extends { id: string; title: string; quantity: unknown; unit: string; unitPrice: unknown }
>(items: T[]): SerializedJobItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
  }));
}

export type SerializedInvoiceItem = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
};

export function serializeInvoiceItems<
  T extends {
    id: string;
    title: string;
    quantity: unknown;
    unit: string;
    unitPrice: unknown;
    vatRate: unknown;
    subtotal: unknown;
    vatAmount: unknown;
    total: unknown;
  }
>(items: T[]): SerializedInvoiceItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    quantity: Number(item.quantity),
    unit: item.unit,
    unitPrice: Number(item.unitPrice),
    vatRate: Number(item.vatRate),
    subtotal: Number(item.subtotal),
    vatAmount: Number(item.vatAmount),
    total: Number(item.total),
  }));
}
