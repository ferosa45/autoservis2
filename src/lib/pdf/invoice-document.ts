import { Document, Page, View, Text, StyleSheet, Font } from '@react-pdf/renderer';
import path from 'path';

// POZNÁMKA: Záměrně NEPOUŽÍVÁME `import React from 'react'`. Next.js
// kompiluje tenhle soubor (přes route.ts) ve webpack "(rsc)" vrstvě, kde
// se 'react' resolvuje jinak než v běžném Node.js kontextu. Externalizovaný
// @react-pdf/renderer (viz next.config.js) interně používá 'react' přes
// čistý Node require() - pokud bychom tady použili běžný import, dostali
// bychom JINOU instanci Reactu, což @react-pdf reconciler odmítá jako
// neplatné elementy ("Minified React error #31").
//
// `eval('require')` je záměrný trik: webpack statickou analýzou nevidí
// dovnitř eval() řetězce, takže tenhle require() nechá být a v runtime se
// spustí jako opravdový Node.js require - stejná cesta k 'react', jakou
// používá i @react-pdf/renderer. Bez tohohle triku by šlo o dvě různé
// instance Reactu v jednom procesu.
// eslint-disable-next-line @typescript-eslint/no-implied-eval, no-eval
const nodeRequire: NodeRequire = eval('require');
const React = nodeRequire('react') as typeof import('react');
const h = React.createElement;

// DejaVu Sans má plnou podporu latin-ext (české diakritiky), na rozdíl od
// vestavěných PDF fontů (Helvetica atd.), které diakritiku neumí vůbec.
// Font je zabalený přímo v projektu (src/lib/pdf/fonts) - žádná závislost
// na externí síti při generování PDF.
Font.register({
  family: 'DejaVuSans',
  fonts: [
    { src: path.join(process.cwd(), 'src/lib/pdf/fonts/DejaVuSans.ttf'), fontWeight: 'normal' },
    { src: path.join(process.cwd(), 'src/lib/pdf/fonts/DejaVuSans-Bold.ttf'), fontWeight: 'bold' },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: 'DejaVuSans',
    fontSize: 9,
    padding: 40,
    color: '#1a1a1a',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: '#555555',
  },
  headerRow: {
    marginBottom: 20,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: '2px solid #1a1a1a',
  },
  metaItem: {
    fontSize: 9,
    color: '#555555',
  },
  partiesRow: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 24,
  },
  partyBox: {
    flex: 1,
    padding: 10,
    border: '1px solid #dddddd',
    borderRadius: 4,
  },
  partyLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#888888',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  partyName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 9,
    color: '#333333',
    marginBottom: 1,
  },
  vatNote: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#888888',
    marginTop: 4,
  },
  table: {
    marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #eeeeee',
    paddingVertical: 6,
  },
  tableHeaderRow: {
    borderBottom: '1px solid #1a1a1a',
    paddingVertical: 4,
  },
  headerCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#555555',
    textTransform: 'uppercase',
  },
  cell: {
    fontSize: 9,
  },
  cellName: { flex: 3 },
  cellQty: { flex: 1.4, textAlign: 'right' },
  cellSmall: { flex: 0.8, textAlign: 'right' },
  cellPrice: { flex: 1.3, textAlign: 'right' },
  totalsBox: {
    alignSelf: 'flex-end',
    width: 220,
    marginTop: 4,
  },
  totalsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    fontSize: 9,
    color: '#555555',
  },
  totalsRowBig: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 4,
    borderTop: '2px solid #1a1a1a',
    fontSize: 13,
    fontWeight: 'bold',
  },
  noteBox: {
    marginTop: 24,
    padding: 10,
    border: '1px solid #dddddd',
    borderRadius: 4,
  },
});

export type InvoicePdfItem = {
  title: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatRate: number;
  subtotal: number;
  vatAmount: number;
  total: number;
};

export type InvoicePdfData = {
  number: string | null;
  issueDate: Date;
  dueDate: Date;
  supplierName: string;
  supplierIco: string | null;
  supplierDic: string | null;
  supplierStreet: string | null;
  supplierCity: string | null;
  supplierZip: string | null;
  supplierBankAccount: string | null;
  supplierIban: string | null;
  customerName: string;
  customerIco: string | null;
  customerDic: string | null;
  customerStreet: string | null;
  customerCity: string | null;
  customerZip: string | null;
  isVatPayer: boolean;
  items: InvoicePdfItem[];
  subtotal: number;
  vatTotal: number;
  total: number;
  note: string | null;
};

function formatDateCz(date: Date): string {
  return date.toLocaleDateString('cs-CZ');
}

function formatMoney(n: number): string {
  return `${Math.round(n).toLocaleString('cs-CZ')} Kč`;
}

/**
 * Variabilní symbol pro platbu - běžná praxe je použít číslo faktury,
 * musí ale obsahovat jen číslice (bankovní VS nepřijímá písmena/pomlčky).
 * Pokud číslo faktury obsahuje i jiné znaky (např. prefix s pomlčkou),
 * pro VS se použijí jen číslice z něj.
 */
function computeVariableSymbol(number: string | null): string | null {
  if (!number) return null;
  const digitsOnly = number.replace(/\D/g, '');
  return digitsOnly.length > 0 ? digitsOnly : null;
}

function addressText(street: string | null, city: string | null, zip: string | null): string | null {
  if (!street && !city && !zip) return null;
  const cityZip = [zip, city].filter(Boolean).join(' ');
  return [street, cityZip].filter(Boolean).join(', ');
}

function buildPartyBox(
  label: string,
  name: string,
  address: string | null,
  ico: string | null,
  dic: string | null,
  bankAccount?: string | null,
  extraNote?: string | null,
  secondExtraNote?: string | null
) {
  const children = [
    h(Text, { style: styles.partyLabel, key: 'label' }, label),
    h(Text, { style: styles.partyName, key: 'name' }, name),
  ];
  if (address) children.push(h(Text, { style: styles.partyLine, key: 'address' }, address));
  if (ico) children.push(h(Text, { style: styles.partyLine, key: 'ico' }, `IČO: ${ico}`));
  if (dic) children.push(h(Text, { style: styles.partyLine, key: 'dic' }, `DIČ: ${dic}`));
  if (bankAccount) children.push(h(Text, { style: styles.partyLine, key: 'bank' }, `Účet: ${bankAccount}`));
  if (extraNote) children.push(h(Text, { style: styles.partyLine, key: 'extraNote' }, extraNote));
  if (secondExtraNote) children.push(h(Text, { style: styles.vatNote, key: 'vatNote' }, secondExtraNote));
  return h(View, { style: styles.partyBox }, ...children);
}

function buildTableHeaderRow(isVatPayer: boolean) {
  const cells = [
    h(Text, { style: [styles.headerCell, styles.cellName], key: 'name' }, 'Název'),
    h(Text, { style: [styles.headerCell, styles.cellQty], key: 'qty' }, 'Množství'),
    h(Text, { style: [styles.headerCell, styles.cellPrice], key: 'price' }, 'Cena/j.'),
  ];
  if (isVatPayer) {
    cells.push(h(Text, { style: [styles.headerCell, styles.cellSmall], key: 'vatRate' }, 'DPH'));
    cells.push(h(Text, { style: [styles.headerCell, styles.cellPrice], key: 'base' }, 'Základ'));
    cells.push(h(Text, { style: [styles.headerCell, styles.cellPrice], key: 'vat' }, 'DPH'));
  }
  cells.push(h(Text, { style: [styles.headerCell, styles.cellPrice], key: 'total' }, 'Celkem'));
  return h(View, { style: [styles.tableRow, styles.tableHeaderRow] }, ...cells);
}

function buildItemRow(item: InvoicePdfItem, isVatPayer: boolean, index: number) {
  const cells = [
    h(Text, { style: [styles.cell, styles.cellName], key: 'name' }, item.title),
    h(Text, { style: [styles.cell, styles.cellQty], key: 'qty' }, `${item.quantity} ${item.unit}`),
    h(Text, { style: [styles.cell, styles.cellPrice], key: 'price' }, formatMoney(item.unitPrice)),
  ];
  if (isVatPayer) {
    cells.push(h(Text, { style: [styles.cell, styles.cellSmall], key: 'vatRate' }, `${item.vatRate}%`));
    cells.push(h(Text, { style: [styles.cell, styles.cellPrice], key: 'base' }, formatMoney(item.subtotal)));
    cells.push(h(Text, { style: [styles.cell, styles.cellPrice], key: 'vat' }, formatMoney(item.vatAmount)));
  }
  cells.push(h(Text, { style: [styles.cell, styles.cellPrice], key: 'total' }, formatMoney(item.total)));
  return h(View, { style: styles.tableRow, key: index }, ...cells);
}

export function buildInvoiceDocument(data: InvoicePdfData) {
  const supplierAddress = addressText(data.supplierStreet, data.supplierCity, data.supplierZip);
  const customerAddress = addressText(data.customerStreet, data.customerCity, data.customerZip);
  const variableSymbol = computeVariableSymbol(data.number);

  // Explicitní označení (ne)plátcovství DPH na dokladu - u neplátce jde
  // o informaci pro odběratele, proč doklad neobsahuje DPH. U plátce je
  // to nadbytečné (DIČ + rozpis DPH už to říká samo), proto se zobrazuje
  // jen pro neplátce.
  const vatStatusNote = data.isVatPayer ? null : 'Neplátce DPH';

  const totalsChildren = [];
  if (data.isVatPayer) {
    totalsChildren.push(
      h(View, { style: styles.totalsRow, key: 'base' }, h(Text, null, 'Základ'), h(Text, null, formatMoney(data.subtotal)))
    );
    totalsChildren.push(
      h(View, { style: styles.totalsRow, key: 'vat' }, h(Text, null, 'DPH'), h(Text, null, formatMoney(data.vatTotal)))
    );
  }
  totalsChildren.push(
    h(
      View,
      { style: styles.totalsRowBig, key: 'total' },
      h(Text, null, 'Celkem k úhradě'),
      h(Text, null, formatMoney(data.total))
    )
  );

  // Řádky pod hlavním nadpisem: datum vystavení/splatnosti vždy, DUZP jen
  // u plátce DPH (u neplátce nejde o daňový doklad, DUZP se nevyžaduje),
  // variabilní symbol vždy, když je k dispozici.
  const subtitleLines = [
    `Datum vystavení: ${formatDateCz(data.issueDate)}`,
    `Datum splatnosti: ${formatDateCz(data.dueDate)}`,
  ];
  if (data.isVatPayer) {
    // Zjednodušení: DUZP = datum vystavení (typické pro servis, který
    // fakturuje ve stejný den, kdy práci dokončí). Pokud fakturujete
    // s odstupem od skutečného dokončení zakázky, ověřte si se svou
    // účetní, jestli by DUZP nemělo být jiné datum.
    subtitleLines.push(`Datum uskutečnění zdanitelného plnění (DUZP): ${formatDateCz(data.issueDate)}`);
  }
  if (variableSymbol) {
    subtitleLines.push(`Variabilní symbol: ${variableSymbol}`);
  }

  const pageChildren = [
    h(View, { style: styles.headerRow, key: 'header' }, h(Text, { style: styles.title }, `FAKTURA ${data.number ?? ''}`)),
    h(
      View,
      { style: styles.partiesRow, key: 'parties' },
      buildPartyBox(
        'Dodavatel',
        data.supplierName,
        supplierAddress,
        data.supplierIco,
        data.supplierDic,
        data.supplierBankAccount,
        data.supplierIban ? `IBAN: ${data.supplierIban}` : vatStatusNote,
        data.supplierIban ? vatStatusNote : null
      ),
      buildPartyBox('Odběratel', data.customerName, customerAddress, data.customerIco, data.customerDic)
    ),
    h(
      View,
      { style: styles.metaRow, key: 'meta' },
      ...subtitleLines.map((line, i) => h(Text, { style: styles.metaItem, key: `meta-${i}` }, line))
    ),
    h(
      View,
      { style: styles.table, key: 'table' },
      buildTableHeaderRow(data.isVatPayer),
      ...data.items.map((item, index) => buildItemRow(item, data.isVatPayer, index))
    ),
    h(View, { style: styles.totalsBox, key: 'totals' }, ...totalsChildren),
  ];

  if (data.note) {
    pageChildren.push(
      h(
        View,
        { style: styles.noteBox, key: 'note' },
        h(Text, { style: styles.partyLabel }, 'Poznámka'),
        h(Text, { style: styles.partyLine }, data.note)
      )
    );
  }

  return h(Document, null, h(Page, { size: 'A4', style: styles.page }, ...pageChildren));
}
