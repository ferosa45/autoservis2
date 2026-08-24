'use client';

import { useState, useTransition } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { updateGarageSettings } from '@/lib/actions/garage.actions';

type GarageSettingsInitial = {
  name: string;
  companyName: string | null;
  ico: string | null;
  dic: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string;
  email: string | null;
  phone: string | null;
  bankAccount: string | null;
  iban: string | null;
  isVatPayer: boolean;
  defaultVatRate: number | null;
  invoicePrefix: string | null;
  invoiceDueDays: number;
  nextInvoiceNumber: number;
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
      />
    </label>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <h2 className="mb-4 font-heading text-sm font-bold text-text-primary">{title}</h2>
      {children}
    </div>
  );
}

export function GarageSettingsForm({ initial }: { initial: GarageSettingsInitial }) {
  const [name, setName] = useState(initial.name);
  const [companyName, setCompanyName] = useState(initial.companyName ?? '');
  const [ico, setIco] = useState(initial.ico ?? '');
  const [dic, setDic] = useState(initial.dic ?? '');
  const [street, setStreet] = useState(initial.street ?? '');
  const [city, setCity] = useState(initial.city ?? '');
  const [zip, setZip] = useState(initial.zip ?? '');
  const [country, setCountry] = useState(initial.country);
  const [email, setEmail] = useState(initial.email ?? '');
  const [phone, setPhone] = useState(initial.phone ?? '');
  const [bankAccount, setBankAccount] = useState(initial.bankAccount ?? '');
  const [iban, setIban] = useState(initial.iban ?? '');
  const [isVatPayer, setIsVatPayer] = useState(initial.isVatPayer);
  const [defaultVatRate, setDefaultVatRate] = useState(
    initial.defaultVatRate != null ? String(initial.defaultVatRate) : ''
  );
  const [invoicePrefix, setInvoicePrefix] = useState(initial.invoicePrefix ?? '');
  const [invoiceDueDays, setInvoiceDueDays] = useState(String(initial.invoiceDueDays));

  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function withDirty<T>(setter: (value: T) => void) {
    return (value: T) => {
      setter(value);
      setSaved(false);
    };
  }

  const handleNameChange = withDirty(setName);
  const handleCompanyNameChange = withDirty(setCompanyName);
  const handleIcoChange = withDirty(setIco);
  const handleDicChange = withDirty(setDic);
  const handleStreetChange = withDirty(setStreet);
  const handleCityChange = withDirty(setCity);
  const handleZipChange = withDirty(setZip);
  const handleCountryChange = withDirty(setCountry);
  const handleEmailChange = withDirty(setEmail);
  const handlePhoneChange = withDirty(setPhone);
  const handleBankAccountChange = withDirty(setBankAccount);
  const handleIbanChange = withDirty(setIban);
  const handleDefaultVatRateChange = withDirty(setDefaultVatRate);
  const handleInvoicePrefixChange = withDirty(setInvoicePrefix);
  const handleInvoiceDueDaysChange = withDirty(setInvoiceDueDays);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      try {
        await updateGarageSettings({
          name,
          companyName,
          ico,
          dic,
          street,
          city,
          zip,
          country,
          email,
          phone,
          bankAccount,
          iban,
          isVatPayer,
          defaultVatRate,
          invoicePrefix,
          invoiceDueDays: parseInt(invoiceDueDays, 10) || 14,
        });
        setSaved(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Uložení se nezdařilo');
      }
    });
  }

  return (
    <div className="space-y-6">
      <Section title="Základní údaje">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Název servisu" value={name} onChange={handleNameChange} />
          <Field label="Telefon" value={phone} onChange={handlePhoneChange} />
          <Field label="Email" value={email} onChange={handleEmailChange} type="email" />
        </div>
      </Section>

      <Section title="Fakturační údaje (dodavatel na faktuře)">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Obchodní jméno"
            value={companyName}
            onChange={handleCompanyNameChange}
            placeholder="Jan Novák - Autoservis"
          />
          <Field label="IČO" value={ico} onChange={handleIcoChange} />
          <Field label="DIČ" value={dic} onChange={handleDicChange} placeholder="pokud jste plátce DPH" />
          <Field label="Ulice a číslo" value={street} onChange={handleStreetChange} />
          <Field label="Město" value={city} onChange={handleCityChange} />
          <Field label="PSČ" value={zip} onChange={handleZipChange} />
          <Field label="Země" value={country} onChange={handleCountryChange} />
          <Field
            label="Bankovní účet"
            value={bankAccount}
            onChange={handleBankAccountChange}
            placeholder="123456789/0100"
          />
          <Field label="IBAN" value={iban} onChange={handleIbanChange} placeholder="volitelné" />
        </div>
      </Section>

      <Section title="DPH a číslování faktur">
        <label className="mb-4 flex items-center gap-2 text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={isVatPayer}
            onChange={(e) => {
              setIsVatPayer(e.target.checked);
              setSaved(false);
            }}
            className="h-4 w-4 rounded border-border bg-elevated accent-primary"
          />
          Jsem plátce DPH
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {isVatPayer && (
            <Field
              label="Výchozí sazba DPH (%)"
              value={defaultVatRate}
              onChange={handleDefaultVatRateChange}
              placeholder="21"
            />
          )}
          <Field label="Prefix čísla faktury" value={invoicePrefix} onChange={handleInvoicePrefixChange} placeholder="2026" />
          <Field label="Splatnost (dní)" value={invoiceDueDays} onChange={handleInvoiceDueDaysChange} type="number" />
        </div>

        <p className="mt-3 text-xs text-text-muted">
          Příští číslo faktury: <span className="font-mono">{initial.nextInvoiceNumber}</span> - přiděluje se
          automaticky při vystavení, zde se needituje.
        </p>

        {isVatPayer && !defaultVatRate && (
          <p className="mt-3 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-xs text-status-blocked-text">
            Jako plátce DPH budete muset sazbu doplnit před vystavením první faktury.
          </p>
        )}
      </Section>

      {error && (
        <p className="rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-2 text-sm text-status-blocked-text">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saved || isPending}
          className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <Check className="h-4 w-4" />
          ) : null}
          {saved ? 'Uloženo' : 'Uložit nastavení'}
        </button>
      </div>
    </div>
  );
}
