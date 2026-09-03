'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, User, Car, Wrench, Clock, X, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { submitQuickJob } from '@/lib/actions/quick-job.actions';
import { CustomerSearchField } from './customer-search-field';
import { VehicleSearchField } from './vehicle-search-field';
import type { CustomerSuggestion, VehicleSuggestion } from '@/lib/actions/lookup.actions';
import type { QuickJobPrefill } from './quick-job-provider';
import { formatForDatetimeLocal } from '@/lib/format';
import { cn } from '@/lib/utils';

type Step = 'form' | 'success';

const QUICK_TASKS = [
  'Výměna motorového oleje a filtrů',
  'Zkontrolovat brzdy',
  'Diagnostika',
  'Výměna rozvodů',
  'Výměna pneumatik',
  'STK - příprava vozidla',
];

function defaultScheduledStart(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function defaultScheduledEnd(start: Date): Date {
  const d = new Date(start);
  d.setHours(d.getHours() + 1);
  return d;
}

type FormState = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  vehicleId: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  tasks: string[];
  scheduledStart: string;
  scheduledEnd: string;
};

function initialFormState(prefill?: QuickJobPrefill): FormState {
  const start = prefill?.scheduledStart ?? defaultScheduledStart();
  const end = prefill?.scheduledEnd ?? defaultScheduledEnd(start);
  return {
    customerId: null,
    customerName: '',
    customerPhone: '',
    vehicleId: null,
    vehicleBrand: '',
    vehicleModel: '',
    vehicleLicensePlate: '',
    tasks: [''],
    scheduledStart: formatForDatetimeLocal(start),
    scheduledEnd: formatForDatetimeLocal(end),
  };
}

export function QuickJobModal({
  open,
  onOpenChange,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill: QuickJobPrefill;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormState>(() => initialFormState(prefill));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, startSubmitTransition] = useTransition();

  // Při každém otevření (i s jiným prefillem, např. jiný klik na volný
  // termín v kalendáři) se formulář znovu inicializuje.
  useEffect(() => {
    if (open) {
      setStep('form');
      setForm(initialFormState(prefill));
      setErrorMessage(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleSelectCustomer(customer: CustomerSuggestion) {
    setForm((prev) => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      vehicleId: null,
      vehicleBrand: '',
      vehicleModel: '',
      vehicleLicensePlate: '',
    }));
    setErrorMessage(null);
  }

  function handleSelectVehicle(vehicle: VehicleSuggestion) {
    setForm((prev) => ({
      ...prev,
      vehicleId: vehicle.id,
      vehicleBrand: vehicle.brand,
      vehicleModel: vehicle.model,
      vehicleLicensePlate: vehicle.licensePlate ?? '',
    }));
    setErrorMessage(null);
  }

  function handleSubmit() {
    setErrorMessage(null);
    startSubmitTransition(async () => {
      const result = await submitQuickJob({
        customerId: form.customerId,
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        vehicleId: form.vehicleId,
        vehicleBrand: form.vehicleBrand,
        vehicleModel: form.vehicleModel,
        vehicleLicensePlate: form.vehicleLicensePlate || null,
        tasks: form.tasks.map((t) => t.trim()).filter(Boolean),
        scheduledStart: new Date(form.scheduledStart).toISOString(),
        scheduledEnd: form.scheduledEnd ? new Date(form.scheduledEnd).toISOString() : null,
      });

      if (result.error === 'READ_ONLY_ACCESS') {
        setErrorMessage('Účet je pouze pro čtení. Pro vytváření nových zakázek aktivujte předplatné.');
        return;
      }

      setStep('success');
      router.refresh();
      setTimeout(() => {
        onOpenChange(false);
      }, 1400);
    });
  }

  const isValid =
    form.customerName.trim().length > 0 &&
    form.customerPhone.trim().length > 0 &&
    form.vehicleBrand.trim().length > 0 &&
    form.vehicleModel.trim().length > 0 &&
    form.scheduledStart.length > 0 &&
    (!form.scheduledEnd || new Date(form.scheduledEnd) >= new Date(form.scheduledStart));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" showClose={step !== 'success'}>
        {step === 'form' && (
          <div className="max-h-[85vh] overflow-y-auto p-6">
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Nová zakázka
            </DialogTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Začněte hledáním zákazníka - pokud existuje, doplní se vozidlo i kontakt.
            </p>

            <div className="mt-5 space-y-5">
              <FieldGroup icon={User} title="Zákazník">
                <CustomerSearchField selectedId={form.customerId} onSelect={handleSelectCustomer} />
                <div className="mt-2 grid grid-cols-2 gap-3">
                  <TextField
                    label="Jméno"
                    value={form.customerName}
                    onChange={(v) => setForm({ ...form, customerName: v, customerId: null })}
                  />
                  <TextField
                    label="Telefon"
                    value={form.customerPhone}
                    onChange={(v) => setForm({ ...form, customerPhone: v, customerId: null })}
                  />
                </div>
              </FieldGroup>

              <FieldGroup icon={Car} title="Vozidlo">
                <div className="rounded-lg border border-border bg-elevated/40 p-3">
                  <p className="mb-2 text-xs font-semibold text-text-primary">Existující vozidlo</p>
                  <VehicleSearchField
                    customerId={form.customerId}
                    selectedId={form.vehicleId}
                    onSelect={handleSelectVehicle}
                  />
                </div>

                <div className="my-3 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                    nebo nové vozidlo
                  </span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="rounded-lg border border-border bg-surface p-3">
                  <p className="mb-2 text-xs text-text-secondary">
                    Zadejte údaje nového vozidla. Pokud se shodují s existujícím vozidlem, použije se automaticky to existující.
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    <TextField
                      label="Značka"
                      value={form.vehicleBrand}
                      onChange={(v) => setForm({ ...form, vehicleBrand: v, vehicleId: null })}
                      placeholder="např. Škoda"
                    />
                    <TextField
                      label="Model"
                      value={form.vehicleModel}
                      onChange={(v) => setForm({ ...form, vehicleModel: v, vehicleId: null })}
                      placeholder="např. Octavia"
                    />
                    <TextField
                      label="SPZ (nepovinné)"
                      value={form.vehicleLicensePlate}
                      onChange={(v) => setForm({ ...form, vehicleLicensePlate: v, vehicleId: null })}
                      placeholder="1AB 2345"
                      mono
                    />
                  </div>
                  {form.customerId && !form.vehicleId && (
                    <p className="mt-2 text-[11px] text-text-muted">
                      U zákazníka s více vozidly vytvoří vyplněná značka a model nové vozidlo, pokud takové ještě nemá.
                    </p>
                  )}
                </div>
              </FieldGroup>

              <FieldGroup icon={Wrench} title="Práce">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  {QUICK_TASKS.map((label) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => {
                        if (form.tasks.includes(label)) return;
                        setForm({
                          ...form,
                          tasks: [...form.tasks.filter((t) => t.trim().length > 0), label],
                        });
                      }}
                      className="rounded-full border border-border px-2.5 py-1 text-xs text-text-secondary hover:border-primary hover:text-primary"
                    >
                      + {label}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {form.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={task}
                        onChange={(e) => {
                          const next = [...form.tasks];
                          next[index] = e.target.value;
                          setForm({ ...form, tasks: next });
                        }}
                        placeholder="Např. Výměna oleje"
                        className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, tasks: form.tasks.filter((_, i) => i !== index) })}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-elevated hover:text-text-primary"
                        aria-label="Odebrat úkon"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, tasks: [...form.tasks, ''] })}
                    className="text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    + Přidat úkon
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup icon={Clock} title="Kdy">
                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-muted">Začátek</span>
                    <input
                      type="datetime-local"
                      value={form.scheduledStart}
                      onChange={(e) => {
                        const nextStart = e.target.value;
                        // Posun začátku posune i konec o stejný rozdíl, ať zůstane
                        // rozumná délka zakázky - uživatel může konec dál upravit ručně.
                        const prevStartDate = new Date(form.scheduledStart);
                        const nextStartDate = new Date(nextStart);
                        const endDate = new Date(form.scheduledEnd);
                        const diffMs = nextStartDate.getTime() - prevStartDate.getTime();
                        const nextEndDate = new Date(endDate.getTime() + diffMs);
                        setForm({
                          ...form,
                          scheduledStart: nextStart,
                          scheduledEnd: formatForDatetimeLocal(nextEndDate),
                        });
                      }}
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-text-muted">Předpokládaný konec</span>
                    <input
                      type="datetime-local"
                      value={form.scheduledEnd}
                      min={form.scheduledStart}
                      onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                      className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                    />
                  </label>
                </div>
              </FieldGroup>
            </div>

            {errorMessage && (
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-status-blocked-border bg-status-blocked-bg px-3 py-3 text-sm text-status-blocked-text">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div>
                  <p className="font-semibold">Účet je pouze pro čtení</p>
                  <p className="mt-0.5">Pro vytváření nových zakázek aktivujte předplatné.</p>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                disabled={!isValid || isSubmitting}
                onClick={handleSubmit}
                className="flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Zapsat zakázku
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center gap-3 p-12">
            <CheckCircle2 className="h-10 w-10 text-status-done-text" />
            <p className="font-heading text-lg font-bold text-text-primary">Zakázka zapsána</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FieldGroup({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Icon className="h-3.5 w-3.5" />
        {title}
      </div>
      {children}
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  mono,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  mono?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none',
          mono && 'font-mono'
        )}
      />
    </label>
  );
}
