import { useState } from 'react';
import type { ApartmentListing, ListingAreaSummary } from '../../listings/types';
import { formatDate } from '../../../shared/utils/date';
import { formatPrice } from '../../../shared/utils/price';
import { getAreaGroup } from '../../../shared/utils/area';
import { Card } from '../../../shared/components/Card';
import { getListingKeywordBadges } from '../../listings/statistics';

type PricedListing = ApartmentListing & { price: number };
type SortMode = 'median' | 'min' | 'count' | 'name';

interface PriceMarker {
  key: string;
  price: number;
  minPrice: number;
  maxPrice: number;
  distinctPriceCount: number;
  listings: PricedListing[];
}

const MARKER_MERGE_DISTANCE = 13;

function createMarkers(
  summary: ListingAreaSummary,
  listings: ApartmentListing[],
  position: (price: number) => number,
): PriceMarker[] {
  const grouped = new Map<number, PricedListing[]>();

  listings
    .filter(
      (listing): listing is PricedListing =>
        listing.complex_id === summary.complex_id &&
        listing.deal_type === '매매' &&
        listing.price !== null &&
        getAreaGroup(listing) === summary.area_group,
    )
    .sort((a, b) => a.price - b.price)
    .forEach((listing) => {
      const samePrice = grouped.get(listing.price) ?? [];
      samePrice.push(listing);
      grouped.set(listing.price, samePrice);
    });

  const markers: PriceMarker[] = [];
  [...grouped.entries()].forEach(([price, samePrice]) => {
    const previous = markers[markers.length - 1];
    if (previous && position(price) - position(previous.price) < MARKER_MERGE_DISTANCE) {
      const mergedListings = [...previous.listings, ...samePrice];
      const averagePrice = mergedListings.reduce((total, listing) => total + listing.price, 0) / mergedListings.length;
      markers[markers.length - 1] = {
        key: `${summary.complex_id}:${summary.area_group}:${previous.minPrice}-${price}`,
        price: averagePrice,
        minPrice: previous.minPrice,
        maxPrice: price,
        distinctPriceCount: previous.distinctPriceCount + 1,
        listings: mergedListings,
      };
      return;
    }

    markers.push({
      key: `${summary.complex_id}:${summary.area_group}:${price}`,
      price,
      minPrice: price,
      maxPrice: price,
      distinctPriceCount: 1,
      listings: samePrice,
    });
  });
  return markers;
}

export function PriceRangeSummary({
  summaries,
  title = '단지별 호가 범위',
  listings,
  showMedian = true,
}: {
  summaries: ListingAreaSummary[];
  title?: string;
  listings?: ApartmentListing[];
  showMedian?: boolean;
}) {
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('count');
  if (!summaries.length) return null;
  const minimum = Math.min(...summaries.map((summary) => summary.min_price));
  const maximum = Math.max(...summaries.map((summary) => summary.max_price));
  const padding = Math.max((maximum - minimum) * 0.05, 10_000_000);
  const start = Math.max(0, minimum - padding);
  const end = maximum + padding;
  const position = (price: number) => ((price - start) / (end - start || 1)) * 100;
  const interactive = Boolean(listings);
  const baselineMedian = Math.min(...summaries.map((summary) => summary.median_price));
  const effectiveSortMode = showMedian || sortMode !== 'median' ? sortMode : 'min';
  const orderedSummaries = [...summaries].sort((a, b) => {
    if (effectiveSortMode === 'min') return a.min_price - b.min_price;
    if (effectiveSortMode === 'count') return a.listing_count - b.listing_count || a.min_price - b.min_price;
    if (effectiveSortMode === 'name') return a.complex_name.localeCompare(b.complex_name, 'ko');
    return a.median_price - b.median_price;
  });

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-bold">{title}</h2>
        <select
          className="rounded-xl border border-slate-100 bg-slate-50 px-2.5 py-2 text-[11px] font-semibold text-slate-600"
          value={effectiveSortMode}
          onChange={(event) => setSortMode(event.target.value as SortMode)}
          aria-label="단지 정렬"
        >
          {showMedian && <option value="median">중앙가 낮은 순</option>}
          <option value="min">최저가 낮은 순</option>
          <option value="count">매물 적은 순</option>
          <option value="name">단지명 순</option>
        </select>
      </div>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        {interactive
          ? '가까운 호가는 숫자 점 하나로 묶어 표시합니다. 점을 누르면 정확한 가격을 확인할 수 있습니다.'
          : '막대는 최저~최고 호가, 세로 표시는 중앙값입니다.'}
      </p>
      <div className="mt-4 divide-y divide-slate-100">
        {orderedSummaries.map((summary) => {
          const color = summary.complex_color;
          const markers = listings ? createMarkers(summary, listings, position) : [];
          const activeMarker = markers.find((marker) => marker.key === selectedMarkerKey);
          const differenceFromLowestMedian = summary.median_price - baselineMedian;

          return (
            <div key={summary.complex_id} className="py-5 first:pt-1 last:pb-1">
              <div className="flex items-start justify-between gap-3 text-xs">
                <p className="flex min-w-0 items-center gap-2 truncate font-semibold text-slate-700">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="truncate">{summary.complex_name}</span>
                </p>
                <div className="flex shrink-0 items-center gap-1.5">
                  {showMedian && (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                      differenceFromLowestMedian === 0
                        ? 'bg-blue-50 text-brand-700'
                        : 'bg-slate-50 text-slate-500'
                    }`}>
                      {differenceFromLowestMedian === 0 ? '중앙가 최저' : `+${formatPrice(differenceFromLowestMedian)}`}
                    </span>
                  )}
                  <span className="text-slate-500">{summary.listing_count}건</span>
                </div>
              </div>
              <div className={`mt-3 grid gap-1 text-center ${showMedian ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <div className="text-left">
                  <p className="text-[11px] font-semibold text-slate-400">최저</p>
                  <p className="metric-number mt-0.5 text-base font-bold text-brand-700">{formatPrice(summary.min_price)}</p>
                </div>
                {showMedian && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500">중앙</p>
                    <p className="metric-number mt-0.5 text-lg font-extrabold text-slate-900">{formatPrice(summary.median_price)}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-slate-400">최고</p>
                  <p className="metric-number mt-0.5 text-base font-bold text-rose-600">{formatPrice(summary.max_price)}</p>
                </div>
              </div>
              {interactive ? (
                <div className="relative mt-3 h-[70px]">
                  <span className="absolute bottom-2 left-0 right-0 h-2 rounded-full bg-slate-100" />
                  <span
                    className="absolute bottom-2 h-2 rounded-full opacity-30"
                    style={{
                      left: `${position(summary.min_price)}%`,
                      width: `${Math.max(position(summary.max_price) - position(summary.min_price), 2)}%`,
                      backgroundColor: color,
                    }}
                  />
                  {showMedian && (
                    <span
                      className="absolute bottom-0 h-6 w-[3px] -translate-x-1/2 rounded-full bg-slate-500"
                      style={{ left: `${position(summary.median_price)}%` }}
                      aria-hidden="true"
                    />
                  )}
                  {markers.map((marker) => (
                    <button
                      key={marker.key}
                      type="button"
                      className={`absolute flex h-8 min-w-8 -translate-x-1/2 items-center justify-center rounded-full border-2 border-white px-1 text-[11px] font-bold text-white shadow-sm transition ${
                        activeMarker?.key === marker.key ? 'ring-2 ring-slate-800 ring-offset-1' : ''
                      }`}
                      style={{
                        left: `${position(marker.price)}%`,
                        bottom: '24px',
                        backgroundColor: color,
                      }}
                      onClick={() => setSelectedMarkerKey(activeMarker?.key === marker.key ? null : marker.key)}
                      aria-label={`${summary.complex_name} ${formatPrice(marker.minPrice)}${marker.maxPrice !== marker.minPrice ? `부터 ${formatPrice(marker.maxPrice)}` : ''} 매물 ${marker.listings.length}건 보기`}
                    >
                      {marker.listings.length > 1 ? marker.listings.length : <span className="h-2.5 w-2.5 rounded-full bg-white" />}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="relative mt-3 h-[18px] rounded-full bg-slate-100">
                  <span
                    className="absolute bottom-0 top-0 rounded-full"
                    style={{
                      left: `${position(summary.min_price)}%`,
                      width: `${Math.max(position(summary.max_price) - position(summary.min_price), 2)}%`,
                      backgroundColor: color,
                    }}
                  />
                  {showMedian && (
                    <span
                      className="absolute -top-1 bottom-[-4px] w-[4px] -translate-x-1/2 rounded-full bg-ink"
                      style={{ left: `${position(summary.median_price)}%` }}
                    />
                  )}
                </div>
              )}
              {activeMarker && (
                <div className="mt-3 overflow-hidden rounded-2xl border border-slate-100 bg-white">
                  <div className="flex items-center justify-between gap-3 bg-slate-50 px-3 py-2.5">
                    <strong className="metric-number text-sm text-brand-700">
                      {activeMarker.minPrice === activeMarker.maxPrice
                        ? formatPrice(activeMarker.minPrice)
                        : `${formatPrice(activeMarker.minPrice)} ~ ${formatPrice(activeMarker.maxPrice)}`}
                    </strong>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {activeMarker.distinctPriceCount > 1 ? `${activeMarker.distinctPriceCount}개 호가 · ` : ''}
                      {activeMarker.listings.length}건
                    </span>
                  </div>
                  <div className="max-h-44 divide-y divide-slate-100 overflow-y-auto text-xs text-slate-600">
                    {[...activeMarker.listings].sort((a, b) => a.price - b.price).map((listing) => {
                      const badges = getListingKeywordBadges(listing);
                      return (
                        <div key={listing.id} className="px-3 py-2.5">
                          <p className="flex justify-between gap-2">
                            <span className="flex min-w-0 gap-2">
                              <strong className="shrink-0 text-slate-800">{formatPrice(listing.price)}</strong>
                              <span className="truncate">{listing.building_no ?? '동 미입력'} · {listing.floor_text ?? '층 미입력'} · {listing.direction ?? '방향 미입력'}</span>
                            </span>
                            <span className="flex shrink-0 items-center justify-end gap-1 whitespace-nowrap text-slate-400">
                              {badges.map((badge) => (
                                <span
                                  key={badge}
                                  className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                    badge === '세안고'
                                      ? 'bg-violet-50 text-violet-700'
                                      : badge === '인테리어'
                                        ? 'bg-emerald-50 text-emerald-700'
                                        : 'bg-slate-100 text-slate-600'
                                  }`}
                                >
                                  {badge}
                                </span>
                              ))}
                              <span className="shrink-0">{formatDate(listing.verified_date)}</span>
                            </span>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
