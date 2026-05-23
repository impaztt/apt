export function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return date.replace(/-/g, '.');
}

export function isStaleDate(date: string | null, days = 30): boolean {
  if (!date) return true;
  const target = new Date(`${date}T00:00:00`);
  const elapsed = Date.now() - target.getTime();
  return elapsed > days * 24 * 60 * 60 * 1000;
}
