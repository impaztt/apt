import type { ApartmentComplex } from '../../complexes/types';
import type { ApartmentListing, AreaGroup } from '../../listings/types';
import { summarizeListings } from '../../listings/statistics';
import { getAreaGroup } from '../../../shared/utils/area';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

const COLORS = ['#3182f6', '#16a34a', '#8b5cf6', '#f97316', '#db2777'];

export function ListingDistributionPlot({
  listings,
  complexes,
  complexIds,
  areaGroup,
  title,
}: {
  listings: ApartmentListing[];
  complexes: ApartmentComplex[];
  complexIds: string[];
  areaGroup: AreaGroup;
  title: string;
}) {
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds).sort(
    (a, b) => complexIds.indexOf(a.complex_id) - complexIds.indexOf(b.complex_id),
  );
  const priced = listings.filter(
    (listing): listing is ApartmentListing & { price: number } =>
      listing.deal_type === '매매' &&
      listing.price !== null &&
      complexIds.includes(listing.complex_id) &&
      getAreaGroup(listing) === areaGroup,
  );

  if (!summaries.length) return null;

  const minimum = Math.min(...priced.map((listing) => listing.price));
  const maximum = Math.max(...priced.map((listing) => listing.price));
  const padding = Math.max((maximum - minimum) * 0.06, 10_000_000);
  const domainMin = Math.max(0, minimum - padding);
  const domainMax = maximum + padding;
  const position = (price: number) => `${((price - domainMin) / (domainMax - domainMin || 1)) * 100}%`;
  const ticks = Array.from({ length: 4 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 3);

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-400">점=매물 1건 · 선=가격 범위 · ◆=중앙값</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">{priced.length}건</span>
      </div>

      <div className="relative mt-5 h-6">
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={`absolute text-[10px] font-medium text-slate-400 ${index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: position(tick) }}
          >
            {(tick / 100_000_000).toFixed(1)}억
          </span>
        ))}
      </div>

      <div className="space-y-4">
        {summaries.map((summary, rowIndex) => {
          const rowListings = priced.filter((listing) => listing.complex_id === summary.complex_id);
          const priceCounts = new Map<number, number>();
          const occurrences = new Map<number, number>();
          rowListings.forEach((listing) => priceCounts.set(listing.price, (priceCounts.get(listing.price) ?? 0) + 1));
          const maxStack = Math.max(...priceCounts.values());
          const color = COLORS[rowIndex % COLORS.length];
          return (
            <div key={summary.complex_id} className="rounded-2xl bg-slate-50 px-3 py-3">
              <div className="flex items-start justify-between gap-2">
                <p className="truncate text-xs font-semibold text-slate-700">{summary.complex_name}</p>
                <p className={`shrink-0 text-[11px] font-semibold ${summary.listing_count === 1 ? 'text-amber-600' : 'text-slate-500'}`}>
                  {summary.listing_count}건{summary.listing_count === 1 ? ' · 표본 부족' : ''}
                </p>
              </div>
              <div className="relative mt-2" style={{ height: `${Math.max(50, 43 + (maxStack - 1) * 11)}px` }}>
                {ticks.map((tick) => (
                  <span
                    key={tick}
                    className="absolute bottom-0 top-0 border-l border-dashed border-slate-200"
                    style={{ left: position(tick) }}
                  />
                ))}
                <span
                  className="absolute bottom-[14px] h-[5px] rounded-full opacity-35"
                  style={{ left: position(summary.min_price), right: `calc(100% - ${position(summary.max_price)})`, backgroundColor: color }}
                />
                <span
                  className="absolute bottom-[11px] h-[11px] w-[11px] -translate-x-1/2 rotate-45"
                  style={{ left: position(summary.median_price), backgroundColor: color }}
                />
                {rowListings.map((listing) => {
                  const stack = occurrences.get(listing.price) ?? 0;
                  occurrences.set(listing.price, stack + 1);
                  return (
                    <span
                      key={listing.id}
                      title={`${summary.complex_name} ${listing.building_no ?? ''} ${formatPrice(listing.price)}`}
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white shadow-sm"
                      style={{ left: position(listing.price), bottom: `${29 + stack * 11}px`, backgroundColor: color }}
                    />
                  );
                })}
              </div>
              <div className="mt-1 flex justify-between text-[11px] text-slate-500">
                <span>최저 <strong className="font-semibold text-brand-700">{formatPrice(summary.min_price)}</strong></span>
                <span>중앙 <strong className="font-semibold text-slate-700">{formatPrice(summary.median_price)}</strong></span>
                <span>최고 <strong className="font-semibold text-slate-700">{formatPrice(summary.max_price)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
