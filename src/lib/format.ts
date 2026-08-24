export function formatTime(date: Date): string {
  return date.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'numeric' });
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
  const weekday = WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  return `${weekday} ${day}. ${month} ${year}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
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
  const sameMonth = weekStart.getMonth() === weekEnd.getMonth();
  const startDay = weekStart.getDate();
  const endDay = weekEnd.getDate();
  const month = MONTHS[weekEnd.getMonth()];
  const year = weekEnd.getFullYear();

  if (sameMonth) {
    return `${startDay}. – ${endDay}. ${month} ${year}`;
  }
  const startMonth = MONTHS[weekStart.getMonth()];
  return `${startDay}. ${startMonth} – ${endDay}. ${month} ${year}`;
}
