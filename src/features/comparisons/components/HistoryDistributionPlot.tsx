import type { ApartmentListing, ListingSnapshot, AreaGroup } from '../../listings/types';
import { createPriceBuckets, getBucketCount } from '../../listings/distribution';
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
  color,
}: {
  snapshots: ListingSnapshot[];
  complexId: string;
  areaGroup: AreaGroup;
  complexName: string;
  color: string;
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
  const buckets = createPriceBuckets(rows.flatMap((row) => row.listings.map((listing) => listing.price)));

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="truncate text-base font-bold">{complexName} 가격대 분포 변화</h2>
      <p className="mt-1 text-[11px] text-slate-400">수집일별 가격 구간의 매물 건수 변화입니다.</p>
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <div
          className="grid items-stretch bg-slate-50 text-center text-[10px] font-semibold text-slate-500"
          style={{ gridTemplateColumns: `minmax(76px, 1.25fr) repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          <span className="px-2 py-2 text-left">수집일</span>
          {buckets.map((bucket) => <span key={bucket.min} className="border-l border-white px-0.5 py-2">{bucket.label}</span>)}
        </div>
        {rows.map((row) => {
          const center = median(row.listings.map((listing) => listing.price));
          return (
            <div
              key={row.date}
              className="grid items-stretch border-t border-slate-100"
              style={{ gridTemplateColumns: `minmax(76px, 1.25fr) repeat(${buckets.length}, minmax(0, 1fr))` }}
            >
              <div className="px-2 py-3">
                <p className="text-[11px] font-semibold text-slate-700">{row.date.slice(5).replace('-', '.')}</p>
                <p className="text-[10px] text-slate-400">{row.listings.length}건</p>
              </div>
              {buckets.map((bucket) => {
                const count = getBucketCount(row.listings, bucket);
                const background = count === 0 ? '#f8fafc' : `${color}${count === 1 ? '33' : count === 2 ? '88' : 'ff'}`;
                return (
                  <div key={bucket.min} className="flex items-center justify-center border-l border-slate-100 p-1.5">
                    <span className={`flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold ${count >= 3 ? 'text-white' : count ? 'text-slate-700' : 'text-slate-300'}`} style={{ backgroundColor: background }}>
                      {count || '-'}
                    </span>
                  </div>
                );
              })}
              <p className="col-span-full px-2 pb-2 text-[10px] text-slate-400">중앙값 {formatPrice(center)}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
