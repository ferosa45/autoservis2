import { readFile } from 'node:fs/promises';
import path from 'node:path';

type GuardCase = {
  file: string;
  functionName: string;
  guard: string;
};

const cases: GuardCase[] = [
  { file: 'src/lib/actions/garage.actions.ts', functionName: 'updateGarageSettings', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/billing.actions.ts', functionName: 'startCheckout', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/billing.actions.ts', functionName: 'openBillingPortal', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/onboarding.actions.ts', functionName: 'completeOnboarding', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/onboarding.actions.ts', functionName: 'saveOnboardingDetails', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/onboarding.actions.ts', functionName: 'skipOnboarding', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/user.actions.ts', functionName: 'listGarageUsers', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/user.actions.ts', functionName: 'createMechanic', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/user.actions.ts', functionName: 'updateMechanicPermissions', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/user.actions.ts', functionName: 'deleteMechanic', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/today.actions.ts', functionName: 'assignMechanic', guard: 'requireOwner(context)' },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'startInvoiceDraft', guard: "requirePermission(context, 'canInvoice')" },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'addInvoiceItem', guard: 'requireInvoiceEditAccess(invoiceId)' },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'updateInvoiceItem', guard: 'requireInvoiceEditAccess(invoiceId)' },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'removeInvoiceItem', guard: 'requireInvoiceEditAccess(invoiceId)' },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'updateInvoiceMeta', guard: 'requireInvoiceEditAccess(invoiceId)' },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'issueInvoice', guard: "requirePermission(context, 'canInvoice')" },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'cancelInvoice', guard: "requirePermission(context, 'canInvoice')" },
  { file: 'src/lib/actions/invoice.actions.ts', functionName: 'markInvoicePaid', guard: "requirePermission(context, 'canInvoice')" },
  { file: 'src/app/api/invoices/[id]/pdf/route.ts', functionName: 'GET', guard: "requirePermission(context, 'canViewInvoices')" },
];

const root = process.cwd();

function extractFunction(source: string, functionName: string): string {
  if (functionName === 'GET') {
    const start = source.indexOf('export async function GET(');
    if (start < 0) throw new Error('GET route not found');
    return source.slice(start, source.indexOf('\n}', start) + 2);
  }

  const marker = `export async function ${functionName}`;
  const start = source.indexOf(marker);
  if (start < 0) throw new Error(`${functionName} not found`);
  const nextExport = source.indexOf('\nexport ', start + marker.length);
  return source.slice(start, nextExport < 0 ? source.length : nextExport);
}

let failed = false;

for (const test of cases) {
  const source = await readFile(path.join(root, test.file), 'utf8');
  const fn = extractFunction(source, test.functionName);
  const guardIndex = fn.indexOf(test.guard);
  const firstDbIndex = Math.min(
    ...['prisma.', 'getStripeClient(', 'getInvoiceDetail(']
      .map((needle) => fn.indexOf(needle))
      .filter((index) => index >= 0)
  );

  if (guardIndex < 0 || (firstDbIndex >= 0 && guardIndex > firstDbIndex)) {
    failed = true;
    console.error(`FAIL ${test.file} -> ${test.functionName}: missing guard before sensitive operation`);
  } else {
    console.log(`PASS ${test.file} -> ${test.functionName}`);
  }
}

if (failed) process.exit(1);
console.log('Authorization guard checks passed.');
