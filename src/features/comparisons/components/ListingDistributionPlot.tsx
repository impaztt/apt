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
  const padding = Math.max((maximum - minimum) * 0.08, 20_000_000);
  const domainMin = Math.max(0, minimum - padding);
  const domainMax = maximum + padding;
  const width = 820;
  const labelWidth = 188;
  const chartWidth = 560;
  const rowHeight = 66;
  const top = 42;
  const height = top + summaries.length * rowHeight + 38;
  const x = (price: number) => labelWidth + ((price - domainMin) / (domainMax - domainMin || 1)) * chartWidth;
  const ticks = Array.from({ length: 5 }, (_, index) => domainMin + ((domainMax - domainMin) * index) / 4);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{title}</h2>
          <p className="mt-1 text-xs text-slate-400">점 하나는 매물 1건이며, 선은 최저~최고 호가, 마름모는 중앙값입니다.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">총 {priced.length}건</span>
      </div>
      <div className="mt-5 overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[700px]">
          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={x(tick)} x2={x(tick)} y1={26} y2={height - 28} stroke="#e2e8f0" strokeDasharray="3 4" />
              <text x={x(tick)} y={16} textAnchor="middle" fill="#94a3b8" fontSize="11">
                {(tick / 100_000_000).toFixed(1)}억
              </text>
            </g>
          ))}
          {summaries.map((summary, rowIndex) => {
            const y = top + rowIndex * rowHeight + 20;
            const rowListings = priced.filter((listing) => listing.complex_id === summary.complex_id);
            const priceCounts = new Map<number, number>();
            const color = COLORS[rowIndex % COLORS.length];
            return (
              <g key={summary.complex_id}>
                <text x={0} y={y - 6} fill="#0f172a" fontSize="12" fontWeight="600">
                  {summary.complex_name.length > 13 ? `${summary.complex_name.slice(0, 13)}...` : summary.complex_name}
                </text>
                <text x={0} y={y + 13} fill="#64748b" fontSize="11">
                  {summary.listing_count}건 {summary.listing_count === 1 ? '(표본 부족)' : ''} · 중앙 {formatPrice(summary.median_price)}
                </text>
                <line
                  x1={x(summary.min_price)}
                  x2={x(summary.max_price)}
                  y1={y}
                  y2={y}
                  stroke={color}
                  strokeOpacity="0.4"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
                <rect
                  x={x(summary.median_price) - 5}
                  y={y - 5}
                  width="10"
                  height="10"
                  fill={color}
                  transform={`rotate(45 ${x(summary.median_price)} ${y})`}
                />
                {rowListings.map((listing) => {
                  const stackIndex = priceCounts.get(listing.price) ?? 0;
                  priceCounts.set(listing.price, stackIndex + 1);
                  return (
                    <circle
                      key={listing.id}
                      cx={x(listing.price)}
                      cy={y - 13 - stackIndex * 10}
                      r="5"
                      fill={color}
                      stroke="white"
                      strokeWidth="1.5"
                    >
                      <title>
                        {summary.complex_name} {listing.building_no ?? ''} · {formatPrice(listing.price)} · {listing.floor_text ?? '층 미입력'}
                      </title>
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
