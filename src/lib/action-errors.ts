export const READ_ONLY_ACCESS_MESSAGE = 'Účet je pouze pro čtení. Pro pokračování aktivujte předplatné.';

export function getActionErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
