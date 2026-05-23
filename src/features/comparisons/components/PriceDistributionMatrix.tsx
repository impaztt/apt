import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import type { ApartmentComplex } from '../../complexes/types';
import type { ApartmentListing, AreaGroup } from '../../listings/types';
import { createPriceBuckets, getBucketCount } from '../../listings/distribution';
import { summarizeListings } from '../../listings/statistics';
import { getAreaGroup } from '../../../shared/utils/area';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

const COLORS = [
  ['#eff6ff', '#bfdbfe', '#60a5fa', '#2563eb'],
  ['#f5f3ff', '#ddd6fe', '#a78bfa', '#7c3aed'],
  ['#ecfdf5', '#bbf7d0', '#4ade80', '#16a34a'],
  ['#fff7ed', '#fed7aa', '#fb923c', '#ea580c'],
];

function shortName(value: string): string {
  return value.length > 6 ? `${value.slice(0, 6)}…` : value;
}

export function PriceDistributionMatrix({
  listings,
  complexes,
  complexIds,
  areaGroup,
  title,
  trendsLink,
}: {
  listings: ApartmentListing[];
  complexes: ApartmentComplex[];
  complexIds: string[];
  areaGroup: AreaGroup;
  title: string;
  trendsLink?: string;
}) {
  const relevant = listings.filter(
    (listing): listing is ApartmentListing & { price: number } =>
      listing.deal_type === '매매' &&
      listing.price !== null &&
      complexIds.includes(listing.complex_id) &&
      getAreaGroup(listing) === areaGroup,
  );
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds).sort(
    (a, b) => complexIds.indexOf(a.complex_id) - complexIds.indexOf(b.complex_id),
  );
  if (!summaries.length) return null;
  const buckets = createPriceBuckets(relevant.map((listing) => listing.price));
  const bestMedian = [...summaries].sort((a, b) => a.median_price - b.median_price)[0];
  const mostListings = [...summaries].sort((a, b) => b.listing_count - a.listing_count)[0];

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold">{title}</h2>
          <p className="mt-1 text-[11px] text-slate-400">칸 안 숫자는 해당 가격대의 매물 건수입니다.</p>
        </div>
        <span className="shrink-0 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">총 {relevant.length}건</span>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
        <div
          className="grid items-stretch bg-slate-50 text-center text-[10px] font-semibold text-slate-500"
          style={{ gridTemplateColumns: `minmax(74px, 1.3fr) repeat(${buckets.length}, minmax(0, 1fr))` }}
        >
          <span className="flex items-center px-2 py-2 text-left">단지</span>
          {buckets.map((bucket) => (
            <span key={bucket.min} className="flex items-center justify-center border-l border-white px-0.5 py-2 leading-4">
              {bucket.label}
            </span>
          ))}
        </div>
        {summaries.map((summary, index) => {
          const rowListings = relevant.filter((listing) => listing.complex_id === summary.complex_id);
          const palette = COLORS[index % COLORS.length];
          return (
            <div
              key={summary.complex_id}
              className="grid items-stretch border-t border-slate-100"
              style={{ gridTemplateColumns: `minmax(74px, 1.3fr) repeat(${buckets.length}, minmax(0, 1fr))` }}
            >
              <div className="flex flex-col justify-center px-2 py-3">
                <p className="truncate text-[11px] font-semibold text-slate-700" title={summary.complex_name}>{shortName(summary.complex_name)}</p>
                <p className="mt-0.5 text-[10px] text-slate-400">{summary.listing_count}건</p>
              </div>
              {buckets.map((bucket) => {
                const count = getBucketCount(rowListings, bucket);
                const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
                return (
                  <div key={bucket.min} className="flex items-center justify-center border-l border-slate-100 p-1.5">
                    <span
                      className={`flex h-10 w-full items-center justify-center rounded-xl text-sm font-bold ${level >= 3 ? 'text-white' : level === 0 ? 'text-slate-300' : 'text-slate-700'}`}
                      style={{ backgroundColor: level === 0 ? '#f8fafc' : palette[level] }}
                    >
                      {count || '-'}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-4 grid gap-2 text-xs sm:grid-cols-2">
        <p className="rounded-xl bg-brand-50 px-3 py-2 text-brand-700">
          중앙값 최저 <strong>{shortName(bestMedian.complex_name)} {formatPrice(bestMedian.median_price)}</strong>
        </p>
        <p className="rounded-xl bg-slate-50 px-3 py-2 text-slate-600">
          매물 최다 <strong>{shortName(mostListings.complex_name)} {mostListings.listing_count}건</strong>
        </p>
      </div>
      {trendsLink && (
        <Link to={trendsLink} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-700">
          기간 변화 보기 <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </Card>
  );
}
