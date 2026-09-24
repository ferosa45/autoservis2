export const READ_ONLY_ACCESS_MESSAGE = 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.';

export function getActionErrorMessage(_error: unknown, fallback: string): string {
  // Server Action exceptions are intentionally sanitized by Next.js in production.
  // Expected user-facing errors should be returned from the action as data ({ ok, error }).
  return fallback;
}
