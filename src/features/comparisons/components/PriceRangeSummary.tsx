import { useState } from 'react';
import type { ApartmentListing, ListingAreaSummary } from '../../listings/types';
import { formatDate } from '../../../shared/utils/date';
import { formatPrice } from '../../../shared/utils/price';
import { getAreaGroup } from '../../../shared/utils/area';
import { Card } from '../../../shared/components/Card';

type PricedListing = ApartmentListing & { price: number };

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
}: {
  summaries: ListingAreaSummary[];
  title?: string;
  listings?: ApartmentListing[];
}) {
  const [selectedMarkerKey, setSelectedMarkerKey] = useState<string | null>(null);
  if (!summaries.length) return null;
  const minimum = Math.min(...summaries.map((summary) => summary.min_price));
  const maximum = Math.max(...summaries.map((summary) => summary.max_price));
  const padding = Math.max((maximum - minimum) * 0.05, 10_000_000);
  const start = Math.max(0, minimum - padding);
  const end = maximum + padding;
  const position = (price: number) => ((price - start) / (end - start || 1)) * 100;
  const interactive = Boolean(listings);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">
        {interactive
          ? '가까운 호가는 숫자 점 하나로 묶어 표시합니다. 점을 누르면 정확한 가격을 확인할 수 있습니다.'
          : '막대는 최저~최고 호가, 세로 표시는 중앙값입니다.'}
      </p>
      <div className="mt-5 space-y-5">
        {summaries.map((summary) => {
          const color = summary.complex_color;
          const markers = listings ? createMarkers(summary, listings, position) : [];
          const activeMarker = markers.find((marker) => marker.key === selectedMarkerKey);

          return (
            <div key={summary.complex_id}>
              <div className="flex justify-between gap-3 text-xs">
                <p className="truncate font-semibold text-slate-700">{summary.complex_name}</p>
                <p className="shrink-0 text-slate-500">{summary.listing_count}건</p>
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
                  <span
                    className="absolute bottom-0 h-6 w-[3px] -translate-x-1/2 rounded-full bg-slate-500"
                    style={{ left: `${position(summary.median_price)}%` }}
                    aria-hidden="true"
                  />
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
                  <span
                    className="absolute -top-1 bottom-[-4px] w-[4px] -translate-x-1/2 rounded-full bg-ink"
                    style={{ left: `${position(summary.median_price)}%` }}
                  />
                </div>
              )}
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>최저 <strong className="text-brand-700">{formatPrice(summary.min_price)}</strong></span>
                <span>중앙 <strong className="text-slate-800">{formatPrice(summary.median_price)}</strong></span>
                <span>최고 <strong className="text-slate-800">{formatPrice(summary.max_price)}</strong></span>
              </div>
              {activeMarker && (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3">
                  <div className="flex items-center justify-between gap-3">
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
                  <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto text-xs text-slate-600">
                    {[...activeMarker.listings].sort((a, b) => a.price - b.price).map((listing) => (
                      <p key={listing.id} className="flex justify-between gap-2">
                        <span className="flex min-w-0 gap-2">
                          <strong className="shrink-0 text-slate-800">{formatPrice(listing.price)}</strong>
                          <span className="truncate">{listing.building_no ?? '동 미입력'} · {listing.floor_text ?? '층 미입력'} · {listing.direction ?? '방향 미입력'}</span>
                        </span>
                        <span className="shrink-0 text-slate-400">{formatDate(listing.verified_date)}</span>
                      </p>
                    ))}
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
