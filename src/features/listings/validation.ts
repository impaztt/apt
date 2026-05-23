import type { ApartmentListing, ListingInput } from './types';

export function validateListingInput(input: Partial<ListingInput>): string[] {
  const errors: string[] = [];
  if (!input.complex_id) errors.push('단지를 선택해 주세요.');
  if (!input.deal_type) errors.push('거래 유형을 선택해 주세요.');
  if (!input.exclusive_area_m2 || input.exclusive_area_m2 <= 0) errors.push('전용면적은 0보다 커야 합니다.');

  if (input.deal_type === '매매' && (!input.price || input.price <= 0)) {
    errors.push('매매 가격은 0보다 커야 합니다.');
  }
  if (input.deal_type === '전세' && (!input.price || input.price <= 0) && (!input.deposit || input.deposit <= 0)) {
    errors.push('전세 가격 또는 보증금을 입력해 주세요.');
  }
  if (
    input.deal_type === '월세' &&
    (input.deposit === undefined || input.deposit === null || input.deposit < 0 ||
      !input.monthly_rent || input.monthly_rent <= 0)
  ) {
    errors.push('월세는 보증금과 월세를 입력해 주세요.');
  }
  return errors;
}

export function isPossibleDuplicate(input: ListingInput, existing: ApartmentListing[]): boolean {
  return existing.some((listing) => {
    const floorMatches =
      (listing.floor !== null && input.floor !== null && listing.floor === input.floor) ||
      (listing.floor_group !== null && listing.floor_group === input.floor_group);
    const dateMatches =
      listing.verified_date !== null &&
      input.verified_date !== null &&
      Math.abs(new Date(listing.verified_date).getTime() - new Date(input.verified_date).getTime()) <=
        7 * 24 * 60 * 60 * 1000;

    return (
      listing.complex_id === input.complex_id &&
      listing.building_no === input.building_no &&
      listing.exclusive_area_m2 === input.exclusive_area_m2 &&
      listing.price === input.price &&
      floorMatches &&
      listing.direction === input.direction &&
      dateMatches
    );
  });
}
