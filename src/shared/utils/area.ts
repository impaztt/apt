import type { ApartmentListing, AreaGroup } from '../../features/listings/types';

export const ALL_AREAS = 'all' as const;

export interface AreaOption {
  key: AreaGroup;
  areaPyeong: number;
  exclusiveAreaPyeong: number;
  label: string;
}

export function getAreaGroup(listing: Pick<ApartmentListing, 'area_pyeong' | 'exclusive_area_pyeong'>): AreaGroup {
  return `${listing.area_pyeong}|${listing.exclusive_area_pyeong}`;
}

export function formatAreaLabel(areaPyeong: number, exclusiveAreaPyeong: number): string {
  return `${areaPyeong}평형 (전용 ${exclusiveAreaPyeong}평)`;
}

export function getAreaOption(listing: Pick<ApartmentListing, 'area_pyeong' | 'exclusive_area_pyeong'>): AreaOption {
  return {
    key: getAreaGroup(listing),
    areaPyeong: listing.area_pyeong,
    exclusiveAreaPyeong: listing.exclusive_area_pyeong,
    label: formatAreaLabel(listing.area_pyeong, listing.exclusive_area_pyeong),
  };
}

export function getAreaOptions(listings: ApartmentListing[]): AreaOption[] {
  const options = new Map<AreaGroup, AreaOption>();
  listings.forEach((listing) => {
    const option = getAreaOption(listing);
    options.set(option.key, option);
  });
  return [...options.values()].sort(
    (a, b) => a.areaPyeong - b.areaPyeong || a.exclusiveAreaPyeong - b.exclusiveAreaPyeong,
  );
}
