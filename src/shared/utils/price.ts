export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '-';
  if (value === 0) return '0';

  const eok = Math.floor(value / 100_000_000);
  const man = Math.round((value % 100_000_000) / 10_000);
  if (!eok) return `${man.toLocaleString('ko-KR')}만`;
  if (!man) return `${eok}억`;
  return `${eok}억 ${man.toLocaleString('ko-KR')}`;
}

export function formatCompactPrice(value: number): string {
  const eok = value / 100_000_000;
  return `${Number.isInteger(eok) ? eok.toFixed(0) : eok.toFixed(1)}억`;
}

export function formatRate(value: number | null): string {
  if (value === null || Number.isNaN(value)) return '-';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
}

export function parsePriceInput(value: string): number | null {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}
