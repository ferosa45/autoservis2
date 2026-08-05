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
