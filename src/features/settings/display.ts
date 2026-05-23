import type { AreaDisplayRule } from './types';

export const DEFAULT_COMPLEX_COLORS = ['#3182f6', '#8b5cf6', '#16a34a', '#f97316', '#db2777', '#0891b2'];

export function formatDisplayAreaLabel(rule: AreaDisplayRule): string {
  return `${rule.display_area_pyeong}평 (${rule.exclusive_area_m2}㎡)`;
}

export function fallbackComplexColor(index: number): string {
  return DEFAULT_COMPLEX_COLORS[index % DEFAULT_COMPLEX_COLORS.length];
}
