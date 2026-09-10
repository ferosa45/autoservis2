import { getSessionContext } from '@/lib/session';
import { getGarage } from '@/lib/services/garage.service';
import { GarageSettingsForm } from '@/components/settings/garage-settings-form';

export default async function SettingsPage() {
  const context = await getSessionContext();
  const garage = await getGarage(context);

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold text-text-primary">Nastavení</h1>
      {context.role === 'OWNER' ? (
        <GarageSettingsForm initial={{
          name: garage.name, companyName: garage.companyName, ico: garage.ico, dic: garage.dic,
          street: garage.street, city: garage.city, zip: garage.zip, country: garage.country,
          email: garage.email, phone: garage.phone, bankAccount: garage.bankAccount, iban: garage.iban,
          isVatPayer: garage.isVatPayer, defaultVatRate: garage.defaultVatRate ? Number(garage.defaultVatRate) : null,
          invoicePrefix: garage.invoicePrefix, invoiceDueDays: garage.invoiceDueDays, nextInvoiceNumber: garage.nextInvoiceNumber,
        }} />
      ) : (
        <div className="rounded-lg border border-border bg-surface p-5 text-sm text-text-secondary">
          Nastavení servisu spravuje majitel. Zde najdete pouze nastavení dostupná pro váš účet.
        </div>
      )}
    </div>
  );
}
