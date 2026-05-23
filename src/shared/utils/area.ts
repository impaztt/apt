import type { AreaGroup } from '../../features/listings/types';

export const AREA_GROUPS: AreaGroup[] = ['59', '74', '84', '99', '113', '129', '148'];

export function getAreaGroup(exclusiveArea: number): AreaGroup {
  if (exclusiveArea >= 55 && exclusiveArea < 65) return '59';
  if (exclusiveArea >= 70 && exclusiveArea < 80) return '74';
  if (exclusiveArea >= 80 && exclusiveArea < 90) return '84';
  if (exclusiveArea >= 95 && exclusiveArea < 105) return '99';
  if (exclusiveArea >= 108 && exclusiveArea < 118) return '113';
  if (exclusiveArea >= 124 && exclusiveArea < 134) return '129';
  if (exclusiveArea >= 143 && exclusiveArea < 153) return '148';
  return '기타';
}

export function formatAreaGroup(areaGroup: AreaGroup): string {
  return areaGroup === '기타' ? areaGroup : `전용 ${areaGroup}㎡`;
}
