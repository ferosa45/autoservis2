'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Loader2, CheckCircle2, User, Car, Wrench, Clock, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { parseQuickJobPreview, submitQuickJob } from '@/lib/actions/quick-job.actions';
import type { QuickJobParseResult } from '@/lib/parser/quick-job-parser.interface';
import { cn } from '@/lib/utils';

type Step = 'input' | 'confirm' | 'success';

const EXAMPLE_PLACEHOLDER = 'Novák Octavia olej a brzdy středa v 9';

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

function defaultScheduledStart(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

type ConfirmState = {
  customerId: string | null;
  customerName: string;
  customerPhone: string;
  vehicleId: string | null;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleLicensePlate: string;
  tasks: string[];
  scheduledStart: string;
};

function buildConfirmState(preview: QuickJobParseResult): ConfirmState {
  return {
    customerId: preview.customer.existingCustomerId,
    customerName: preview.customer.name ?? '',
    customerPhone: preview.customer.phone ?? '',
    vehicleId: preview.vehicle.existingVehicleId,
    vehicleBrand: preview.vehicle.brand ?? '',
    vehicleModel: preview.vehicle.model ?? '',
    vehicleLicensePlate: preview.vehicle.licensePlate ?? '',
    tasks: preview.tasks.length > 0 ? preview.tasks : [''],
    scheduledStart: toDatetimeLocalValue(preview.scheduledStart ?? defaultScheduledStart()),
  };
}

export function QuickJobLauncher() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>('input');
  const [text, setText] = useState('');
  const [preview, setPreview] = useState<QuickJobParseResult | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isParsing, startParseTransition] = useTransition();
  const [isSubmitting, startSubmitTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) {
      setPreview(null);
      return;
    }
    debounceRef.current = setTimeout(() => {
      startParseTransition(async () => {
        const result = await parseQuickJobPreview(text);
        setPreview(result);
      });
    }, 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [text]);

  function reset() {
    setStep('input');
    setText('');
    setPreview(null);
    setConfirmState(null);
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) reset();
  }

  function handleContinue() {
    const source: QuickJobParseResult =
      preview ?? {
        customer: { existingCustomerId: null, name: null, phone: null },
        vehicle: { existingVehicleId: null, brand: null, model: null, licensePlate: null },
        tasks: [],
        scheduledStart: null,
        unrecognizedText: text,
      };
    setConfirmState(buildConfirmState(source));
    setStep('confirm');
  }

  function handleSubmit() {
    if (!confirmState) return;
    startSubmitTransition(async () => {
      await submitQuickJob({
        customerId: confirmState.customerId,
        customerName: confirmState.customerName,
        customerPhone: confirmState.customerPhone,
        vehicleId: confirmState.vehicleId,
        vehicleBrand: confirmState.vehicleBrand,
        vehicleModel: confirmState.vehicleModel,
        vehicleLicensePlate: confirmState.vehicleLicensePlate,
        tasks: confirmState.tasks.map((t) => t.trim()).filter(Boolean),
        scheduledStart: new Date(confirmState.scheduledStart).toISOString(),
      });
      setStep('success');
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        reset();
      }, 1400);
    });
  }

  const isConfirmValid =
    !!confirmState &&
    confirmState.customerName.trim().length > 0 &&
    confirmState.customerPhone.trim().length > 0 &&
    confirmState.vehicleBrand.trim().length > 0 &&
    confirmState.vehicleModel.trim().length > 0 &&
    confirmState.scheduledStart.length > 0;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        <Plus className="h-4 w-4" />
        Nová zakázka
      </button>

      <DialogContent className="max-w-xl" showClose={step !== 'success'}>
        {step === 'input' && (
          <div className="p-6">
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Co si chcete zapsat?
            </DialogTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Napište volným textem, kdo přijede, s čím a kdy - zbytek zkusíme rozpoznat.
            </p>

            <textarea
              autoFocus
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={EXAMPLE_PLACEHOLDER}
              rows={2}
              className="mt-4 w-full resize-none rounded-lg border border-border bg-elevated px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
            />

            {text.trim().length > 0 && (
              <div className="mt-4 rounded-lg border border-border bg-elevated p-4">
                {isParsing && !preview ? (
                  <div className="flex items-center gap-2 text-sm text-text-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Rozpoznávám...
                  </div>
                ) : preview ? (
                  <PreviewSummary preview={preview} />
                ) : null}
              </div>
            )}

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                disabled={text.trim().length === 0}
                onClick={handleContinue}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-40"
              >
                Pokračovat
              </button>
            </div>
          </div>
        )}

        {step === 'confirm' && confirmState && (
          <div className="max-h-[80vh] overflow-y-auto p-6">
            <DialogTitle className="font-heading text-lg font-bold text-text-primary">
              Zkontrolujte zakázku
            </DialogTitle>
            <p className="mt-1 text-sm text-text-secondary">
              Cokoliv nesedí, klidně opravte - nic se zatím neuložilo.
            </p>

            <div className="mt-5 space-y-5">
              <FieldGroup icon={User} title="Zákazník">
                <div className="grid grid-cols-2 gap-3">
                  <TextField
                    label="Jméno"
                    value={confirmState.customerName}
                    onChange={(v) => setConfirmState({ ...confirmState, customerName: v, customerId: null })}
                  />
                  <TextField
                    label="Telefon"
                    value={confirmState.customerPhone}
                    onChange={(v) => setConfirmState({ ...confirmState, customerPhone: v, customerId: null })}
                  />
                </div>
                {confirmState.customerId && (
                  <p className="mt-1.5 text-xs text-status-done-text">Existující zákazník</p>
                )}
              </FieldGroup>

              <FieldGroup icon={Car} title="Vozidlo">
                <div className="grid grid-cols-3 gap-3">
                  <TextField
                    label="Značka"
                    value={confirmState.vehicleBrand}
                    onChange={(v) => setConfirmState({ ...confirmState, vehicleBrand: v, vehicleId: null })}
                  />
                  <TextField
                    label="Model"
                    value={confirmState.vehicleModel}
                    onChange={(v) => setConfirmState({ ...confirmState, vehicleModel: v, vehicleId: null })}
                  />
                  <TextField
                    label="SPZ (nepovinné)"
                    value={confirmState.vehicleLicensePlate}
                    onChange={(v) =>
                      setConfirmState({ ...confirmState, vehicleLicensePlate: v, vehicleId: null })
                    }
                    placeholder="doplníte u auta"
                    mono
                  />
                </div>
                {confirmState.vehicleId && (
                  <p className="mt-1.5 text-xs text-status-done-text">Existující vozidlo</p>
                )}
              </FieldGroup>

              <FieldGroup icon={Wrench} title="Práce">
                <div className="space-y-2">
                  {confirmState.tasks.map((task, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        value={task}
                        onChange={(e) => {
                          const next = [...confirmState.tasks];
                          next[index] = e.target.value;
                          setConfirmState({ ...confirmState, tasks: next });
                        }}
                        placeholder="Např. Výměna oleje"
                        className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setConfirmState({
                            ...confirmState,
                            tasks: confirmState.tasks.filter((_, i) => i !== index),
                          })
                        }
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-elevated hover:text-text-primary"
                        aria-label="Odebrat úkon"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setConfirmState({ ...confirmState, tasks: [...confirmState.tasks, ''] })}
                    className="text-xs font-medium text-primary hover:text-primary-hover"
                  >
                    + Přidat úkon
                  </button>
                </div>
              </FieldGroup>

              <FieldGroup icon={Clock} title="Kdy">
                <input
                  type="datetime-local"
                  value={confirmState.scheduledStart}
                  onChange={(e) => setConfirmState({ ...confirmState, scheduledStart: e.target.value })}
                  className="w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
                />
              </FieldGroup>
            </div>

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-secondary hover:bg-elevated"
              >
                Zpět
              </button>
              <button
                type="button"
                disabled={!isConfirmValid || isSubmitting}
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

function PreviewSummary({ preview }: { preview: QuickJobParseResult }) {
  const hasVehicle = preview.vehicle.brand || preview.vehicle.model || preview.vehicle.licensePlate;

  return (
    <div className="space-y-3 text-sm">
      <PreviewRow label="Zákazník" value={preview.customer.name || 'Nerozpoznáno - doplníte ručně'} />
      <PreviewRow
        label="Vozidlo"
        value={
          hasVehicle
            ? [preview.vehicle.brand, preview.vehicle.model, preview.vehicle.licensePlate]
                .filter(Boolean)
                .join(' · ')
            : 'Nerozpoznáno - doplníte ručně'
        }
      />
      <PreviewRow
        label="Práce"
        value={preview.tasks.length > 0 ? preview.tasks.join(', ') : 'Nerozpoznáno - doplníte ručně'}
      />
      <PreviewRow
        label="Kdy"
        value={
          preview.scheduledStart
            ? preview.scheduledStart.toLocaleString('cs-CZ', {
                weekday: 'long',
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Nerozpoznáno - doplníte ručně'
        }
      />
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-right text-text-primary">{value}</span>
    </div>
  );
}
