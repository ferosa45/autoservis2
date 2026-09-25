export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeCompactSearchText(value: string): string {
  return normalizeSearchText(value).replace(/[^a-z0-9]/g, '');
}
