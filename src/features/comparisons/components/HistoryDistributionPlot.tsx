import type { ApartmentListing, ListingSnapshot, AreaGroup } from '../../listings/types';
import { getAreaGroup } from '../../../shared/utils/area';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

function median(prices: number[]): number {
  const values = [...prices].sort((a, b) => a - b);
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}

export function HistoryDistributionPlot({
  snapshots,
  complexId,
  areaGroup,
  complexName,
}: {
  snapshots: ListingSnapshot[];
  complexId: string;
  areaGroup: AreaGroup;
  complexName: string;
}) {
  const rows = snapshots
    .filter((snapshot) => snapshot.complex_id === complexId)
    .map((snapshot) => ({
      date: snapshot.captured_date,
      listings: snapshot.listings.filter(
        (listing): listing is ApartmentListing & { price: number } =>
          listing.deal_type === '매매' && listing.price !== null && getAreaGroup(listing) === areaGroup,
      ),
    }))
    .filter((row) => row.listings.length)
    .sort((a, b) => a.date.localeCompare(b.date));
  if (!rows.length) return null;

  const prices = rows.flatMap((row) => row.listings.map((listing) => listing.price));
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const padding = Math.max((maximum - minimum) * 0.06, 10_000_000);
  const domainMin = Math.max(0, minimum - padding);
  const domainMax = maximum + padding;
  const position = (price: number) => `${((price - domainMin) / (domainMax - domainMin || 1)) * 100}%`;
  const ticks = Array.from({ length: 4 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 3);

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="truncate text-base font-semibold">{complexName} 분포 이동</h2>
      <p className="mt-1 text-[11px] leading-5 text-slate-400">날짜별 점의 위치와 개수 변화로 호가 이동을 확인합니다.</p>
      <div className="relative mt-5 h-6">
        {ticks.map((tick, index) => (
          <span
            key={tick}
            className={`absolute text-[10px] text-slate-400 ${index === 0 ? '' : index === ticks.length - 1 ? '-translate-x-full' : '-translate-x-1/2'}`}
            style={{ left: position(tick) }}
          >
            {(tick / 100_000_000).toFixed(1)}억
          </span>
        ))}
      </div>
      <div className="space-y-3">
        {rows.map((row) => {
          const sortedPrices = row.listings.map((listing) => listing.price).sort((a, b) => a - b);
          const center = median(sortedPrices);
          const occurrences = new Map<number, number>();
          const countByPrice = new Map<number, number>();
          row.listings.forEach((listing) => countByPrice.set(listing.price, (countByPrice.get(listing.price) ?? 0) + 1));
          const maxStack = Math.max(...countByPrice.values());
          return (
            <div key={row.date} className="rounded-2xl bg-slate-50 p-3">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-700">{row.date.replace(/-/g, '.')}</span>
                <span className="text-slate-500">{row.listings.length}건 · 중앙 {formatPrice(center)}</span>
              </div>
              <div className="relative mt-2" style={{ height: `${Math.max(45, 39 + (maxStack - 1) * 10)}px` }}>
                {ticks.map((tick) => (
                  <span key={tick} className="absolute bottom-0 top-0 border-l border-dashed border-slate-200" style={{ left: position(tick) }} />
                ))}
                <span
                  className="absolute bottom-[12px] h-[5px] rounded-full"
                  style={{ left: position(sortedPrices[0]), right: `calc(100% - ${position(sortedPrices[sortedPrices.length - 1])})`, backgroundColor: '#93c5fd' }}
                />
                <span
                  className="absolute bottom-[9px] h-[11px] w-[11px] -translate-x-1/2 rotate-45 bg-brand-600"
                  style={{ left: position(center) }}
                />
                {row.listings.map((listing) => {
                  const stack = occurrences.get(listing.price) ?? 0;
                  occurrences.set(listing.price, stack + 1);
                  return (
                    <span
                      key={listing.id}
                      title={formatPrice(listing.price)}
                      className="absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-white bg-brand-600"
                      style={{ left: position(listing.price), bottom: `${27 + stack * 10}px` }}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
