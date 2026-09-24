import { TZDate } from '@date-fns/tz';

export const APP_TIME_ZONE = 'Europe/Prague';

export function toPrague(date: Date): TZDate {
  return new TZDate(date, APP_TIME_ZONE);
}

export function startOfPragueDay(date: Date): Date {
  const local = toPrague(date);
  return new TZDate(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    0,
    0,
    0,
    0,
    APP_TIME_ZONE
  );
}

export function endOfPragueDay(date: Date): Date {
  const local = toPrague(date);
  return new TZDate(
    local.getFullYear(),
    local.getMonth(),
    local.getDate(),
    23,
    59,
    59,
    999,
    APP_TIME_ZONE
  );
}

export function startOfPragueMonth(year: number, month: number): Date {
  return new TZDate(year, month, 1, 0, 0, 0, 0, APP_TIME_ZONE);
}

export function endOfPragueMonth(year: number, month: number): Date {
  return new TZDate(year, month + 1, 0, 23, 59, 59, 999, APP_TIME_ZONE);
}

export function addPragueDays(date: Date, days: number): Date {
  const local = toPrague(date);
  local.setDate(local.getDate() + days);
  return local;
}

export function getPragueDateParts(date: Date) {
  const local = toPrague(date);
  return {
    year: local.getFullYear(),
    month: local.getMonth(),
    day: local.getDate(),
    dayOfWeek: local.getDay(),
  };
}

export function toPragueDateParam(date: Date): string {
  const local = toPrague(date);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${local.getFullYear()}-${pad(local.getMonth() + 1)}-${pad(local.getDate())}`;
}

export function parsePragueDateParam(value: string | undefined): Date {
  if (!value || !/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return new Date();
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new TZDate(year, month - 1, day, 0, 0, 0, 0, APP_TIME_ZONE);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}
