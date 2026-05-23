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
  const padding = Math.max((maximum - minimum) * 0.08, 20_000_000);
  const domainMin = Math.max(0, minimum - padding);
  const domainMax = maximum + padding;
  const width = 820;
  const labelWidth = 120;
  const chartWidth = 610;
  const rowHeight = 54;
  const top = 40;
  const height = top + rows.length * rowHeight + 32;
  const x = (price: number) => labelWidth + ((price - domainMin) / (domainMax - domainMin || 1)) * chartWidth;
  const ticks = Array.from({ length: 5 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 4);

  return (
    <Card>
      <h2 className="text-base font-semibold">{complexName} 날짜별 분포 이동</h2>
      <p className="mt-1 text-xs text-slate-400">점들이 왼쪽으로 이동하거나 늘어나면 저가 매물의 증가 여부를 확인할 수 있습니다.</p>
      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[680px]">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={25} y2={height - 25} stroke="#e2e8f0" strokeDasharray="3 4" />
              <text x={x(tick)} y={15} textAnchor="middle" fill="#94a3b8" fontSize="11">
                {(tick / 100_000_000).toFixed(1)}억
              </text>
            </g>
          ))}
          {rows.map((row, index) => {
            const y = top + index * rowHeight + 18;
            const sortedPrices = row.listings.map((listing) => listing.price).sort((a, b) => a - b);
            const center = median(sortedPrices);
            const counts = new Map<number, number>();
            return (
              <g key={row.date}>
                <text x={0} y={y + 4} fill="#475569" fontSize="12" fontWeight="600">
                  {row.date.slice(5).replace('-', '.')} ({row.listings.length}건)
                </text>
                <line x1={x(sortedPrices[0])} x2={x(sortedPrices[sortedPrices.length - 1])} y1={y} y2={y} stroke="#93c5fd" strokeWidth="6" strokeLinecap="round" />
                <rect x={x(center) - 5} y={y - 5} width="10" height="10" fill="#3182f6" transform={`rotate(45 ${x(center)} ${y})`} />
                {row.listings.map((listing) => {
                  const stack = counts.get(listing.price) ?? 0;
                  counts.set(listing.price, stack + 1);
                  return (
                    <circle key={listing.id} cx={x(listing.price)} cy={y - 12 - stack * 9} r="4.5" fill="#3182f6">
                      <title>{formatPrice(listing.price)} · {listing.building_no ?? ''}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
    </Card>
  );
}
