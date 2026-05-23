import type { ApartmentComplex } from '../complexes/types';
import type { ApartmentListing, AreaSelection, ListingAreaSummary } from './types';
import { getAreaGroup } from '../../shared/utils/area';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
}

export function summarizeListings(
  listings: ApartmentListing[],
  complexes: ApartmentComplex[],
  areaGroup?: AreaSelection,
  complexIds?: string[],
): ListingAreaSummary[] {
  const complexMap = new Map(complexes.map((complex) => [complex.id, complex]));
  const grouped = new Map<string, ApartmentListing[]>();

  listings
    .filter((listing) => listing.deal_type === '매매' && listing.price !== null)
    .filter((listing) => !complexIds || complexIds.includes(listing.complex_id))
    .filter((listing) => !areaGroup || areaGroup === 'all' || getAreaGroup(listing) === areaGroup)
    .forEach((listing) => {
      const listingArea = getAreaGroup(listing);
      const key = `${listing.complex_id}:${listingArea}`;
      const group = grouped.get(key) ?? [];
      group.push(listing);
      grouped.set(key, group);
    });

  return [...grouped.entries()]
    .map(([key, group]) => {
      const [complexId, groupName] = key.split(':');
      const pricedListings = group as Array<ApartmentListing & { price: number }>;
      const prices = pricedListings.map((listing) => listing.price);
      const pricePerPyeong =
        pricedListings.reduce((total, listing) => total + listing.price / listing.area_pyeong, 0) /
        pricedListings.length;
      const minListing = pricedListings.reduce((min, item) => (item.price < min.price ? item : min));
      const maxListing = pricedListings.reduce((max, item) => (item.price > max.price ? item : max));

      const verifiedDates = group
        .map((listing) => listing.verified_date)
        .filter((date): date is string => date !== null)
        .sort();

      return {
        complex_id: complexId,
        complex_name: complexMap.get(complexId)?.name ?? '삭제된 단지',
        area_group: groupName,
        area_pyeong: pricedListings[0].area_pyeong,
        exclusive_area_pyeong: pricedListings[0].exclusive_area_pyeong,
        area_label: `${pricedListings[0].area_pyeong}평형 (전용 ${pricedListings[0].exclusive_area_pyeong}평)`,
        listing_count: pricedListings.length,
        min_price: minListing.price,
        max_price: maxListing.price,
        avg_price: prices.reduce((total, price) => total + price, 0) / prices.length,
        median_price: median(prices),
        price_per_pyeong: pricePerPyeong,
        latest_verified_date: verifiedDates[verifiedDates.length - 1] ?? null,
        min_listing: minListing,
        max_listing: maxListing,
      };
    })
    .sort((a, b) => a.area_pyeong - b.area_pyeong || a.avg_price - b.avg_price);
}

export function getGroupAverage(summaries: ListingAreaSummary[]): number | null {
  const totalListings = summaries.reduce((total, summary) => total + summary.listing_count, 0);
  if (!totalListings) return null;
  return summaries.reduce((total, summary) => total + summary.avg_price * summary.listing_count, 0) / totalListings;
}

export function getRelativeRate(price: number, groupAverage: number | null): number | null {
  if (!groupAverage) return null;
  return ((price - groupAverage) / groupAverage) * 100;
}
