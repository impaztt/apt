import type { ApartmentComplex } from '../complexes/types';
import type {
  ApartmentListing,
  AreaSelection,
  ListingAreaSummary,
  TenantOccupiedFilterMode,
  ListingSnapshot,
  ListingTrendPoint,
  SnapshotChangeSummary,
} from './types';
import { getAreaGroup, getAreaOption } from '../../shared/utils/area';

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) return (sorted[middle - 1] + sorted[middle]) / 2;
  return sorted[middle];
}

export function isSpecialListing(listing: ApartmentListing): boolean {
  return listing.is_special_unit || Boolean(listing.special_unit_type);
}

export function filterSpecialListings(listings: ApartmentListing[], includeSpecialUnits: boolean): ApartmentListing[] {
  return includeSpecialUnits ? listings : listings.filter((listing) => !isSpecialListing(listing));
}

function listingKeywordValues(listing: ApartmentListing): string[] {
  const sources = [
    listing.keyword_analysis,
    ...listing.broker_details.map((detail) => detail.keyword_analysis),
  ];
  return sources.flatMap((analysis) =>
    analysis
      ? [analysis.occupancy_type, analysis.structure_type, analysis.condition_type].filter(
          (value): value is string => value !== null,
        )
      : [],
  );
}

export function isTenantOccupiedListing(listing: ApartmentListing): boolean {
  return listingKeywordValues(listing).some((value) => value.includes('세안고'));
}

export function filterTenantOccupiedListings(
  listings: ApartmentListing[],
  mode: TenantOccupiedFilterMode,
): ApartmentListing[] {
  if (mode === 'all') return listings;
  return listings.filter((listing) => isTenantOccupiedListing(listing) === (mode === 'only'));
}

export function getListingKeywordBadges(listing: ApartmentListing): string[] {
  const values = listingKeywordValues(listing);
  return [
    ...(values.some((value) => value.includes('세안고')) ? ['세안고'] : []),
    ...(values.some((value) => value.includes('기본')) ? ['기본'] : []),
    ...(values.some((value) => value.includes('인테리어')) ? ['인테리어'] : []),
  ];
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
      const areaOption = getAreaOption(pricedListings[0]);
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
        complex_color: complexMap.get(complexId)?.color ?? '#3182f6',
        area_group: groupName,
        area_pyeong: areaOption.areaPyeong,
        exclusive_area_pyeong: pricedListings[0].exclusive_area_pyeong,
        area_label: areaOption.label,
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

export function summarizeSnapshotHistory(
  snapshots: ListingSnapshot[],
  complexes: ApartmentComplex[],
  areaGroup: AreaSelection,
  complexIds: string[],
): ListingTrendPoint[] {
  if (areaGroup === 'all') return [];
  return snapshots
    .filter((snapshot) => complexIds.includes(snapshot.complex_id))
    .flatMap((snapshot) =>
      summarizeListings(snapshot.listings, complexes, areaGroup, [snapshot.complex_id]).map((summary) => ({
        complex_id: summary.complex_id,
        complex_name: summary.complex_name,
        complex_color: summary.complex_color,
        area_group: summary.area_group,
        area_label: summary.area_label,
        captured_date: snapshot.captured_date,
        listing_count: summary.listing_count,
        min_price: summary.min_price,
        max_price: summary.max_price,
        avg_price: summary.avg_price,
        median_price: summary.median_price,
      })),
    )
    .sort((a, b) => a.captured_date.localeCompare(b.captured_date) || a.complex_name.localeCompare(b.complex_name, 'ko'));
}

function trackingKey(listing: ApartmentListing): string {
  return [
    listing.building_no,
    listing.deal_type,
    listing.area_pyeong,
    listing.exclusive_area_pyeong,
    listing.floor_text,
    listing.direction,
  ].join('|');
}

export function compareLatestSnapshots(
  snapshots: ListingSnapshot[],
  areaGroup: AreaSelection,
  complexIds: string[],
): SnapshotChangeSummary[] {
  if (areaGroup === 'all') return [];
  return complexIds.flatMap((complexId) => {
    const history = snapshots
      .filter((snapshot) => snapshot.complex_id === complexId)
      .sort((a, b) => a.captured_date.localeCompare(b.captured_date));
    if (history.length < 2) return [];
    const previous = history[history.length - 2];
    const current = history[history.length - 1];
    const select = (listing: ApartmentListing) =>
      listing.deal_type === '매매' && listing.price !== null && getAreaGroup(listing) === areaGroup;
    const before = previous.listings.filter(select);
    const after = current.listings.filter(select);
    const beforeMap = new Map(before.map((listing) => [trackingKey(listing), listing]));
    const afterMap = new Map(after.map((listing) => [trackingKey(listing), listing]));
    const repriced = [...afterMap.entries()]
      .filter(([key, listing]) => beforeMap.has(key) && beforeMap.get(key)?.price !== listing.price)
      .map(([key, listing]) => ({ before: beforeMap.get(key) as ApartmentListing, after: listing }));
    const repricedKeys = new Set(repriced.map((item) => trackingKey(item.after)));
    return [{
      complex_id: complexId,
      complex_name: current.complex_name,
      previous_date: previous.captured_date,
      current_date: current.captured_date,
      added: after.filter((listing) => !beforeMap.has(trackingKey(listing)) && !repricedKeys.has(trackingKey(listing))),
      removed: before.filter((listing) => !afterMap.has(trackingKey(listing)) && !repricedKeys.has(trackingKey(listing))),
      repriced,
    }];
  });
}
