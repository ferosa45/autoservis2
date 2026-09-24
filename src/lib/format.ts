import { toPrague } from '@/lib/date-time';

export function formatTime(date: Date): string {
  return toPrague(date).toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date): string {
  return toPrague(date).toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
}

export function formatDateTime(date: Date): string {
  return `${formatShortDate(date)}. ${date.getFullYear()} ${formatTime(date)}`;
}

const WEEKDAYS = [
  'Neděle',
  'Pondělí',
  'Úterý',
  'Středa',
  'Čtvrtek',
  'Pátek',
  'Sobota',
];

const MONTHS = [
  'ledna',
  'února',
  'března',
  'dubna',
  'května',
  'června',
  'července',
  'srpna',
  'září',
  'října',
  'listopadu',
  'prosince',
];

export function formatFullDate(date: Date): string {
  const local = toPrague(date);
  const weekday = WEEKDAYS[local.getDay()];
  const day = local.getDate();
  const month = MONTHS[local.getMonth()];
  const year = local.getFullYear();
  return `${weekday} ${day}. ${month} ${year}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    toPrague(a).getFullYear() === toPrague(b).getFullYear() &&
    toPrague(a).getMonth() === toPrague(b).getMonth() &&
    toPrague(a).getDate() === toPrague(b).getDate()
  );
}

export function formatCurrency(amount: number): string {
  return `${Math.round(amount).toLocaleString('cs-CZ')} Kč`;
}

/**
 * Formátuje Date do tvaru, který očekává <input type="datetime-local">
 * ("YYYY-MM-DDTHH:mm"), v lokálním čase (ne UTC - proto ne .toISOString()).
 */
export function formatForDatetimeLocal(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const WEEKDAYS_SHORT = ['Ne', 'Po', 'Út', 'St', 'Čt', 'Pá', 'So'];

export function formatWeekdayShort(date: Date): string {
  return WEEKDAYS_SHORT[date.getDay()]!;
}

export function formatWeekRange(weekStart: Date, weekEnd: Date): string {
  const start = toPrague(weekStart);
  const end = toPrague(weekEnd);
  const sameMonth = start.getMonth() === end.getMonth();
  const startDay = start.getDate();
  const endDay = end.getDate();
  const month = MONTHS[end.getMonth()];
  const year = end.getFullYear();

  if (sameMonth) {
    return `${startDay}. – ${endDay}. ${month} ${year}`;
  }
  const startMonth = MONTHS[start.getMonth()];
  return `${startDay}. ${startMonth} – ${endDay}. ${month} ${year}`;
}
