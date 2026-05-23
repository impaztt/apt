import { ChevronRight } from 'lucide-react';
import type { ListingAreaSummary, AreaGroup } from '../../listings/types';
import type { AreaOption } from '../../../shared/utils/area';
import { Card } from '../../../shared/components/Card';
import { formatPrice, formatRate } from '../../../shared/utils/price';

function sortedByMedian(summaries: ListingAreaSummary[]): ListingAreaSummary[] {
  return [...summaries].sort((a, b) => a.median_price - b.median_price || a.min_price - b.min_price);
}

function priceDifference(price: number, reference: number): string {
  const difference = price - reference;
  if (difference === 0) return '기준';
  return `+${formatPrice(difference)}`;
}

export function AllAreasComparisonCards({
  options,
  summariesForArea,
  onSelect,
}: {
  options: AreaOption[];
  summariesForArea: (areaGroup: AreaGroup) => ListingAreaSummary[];
  onSelect: (areaGroup: AreaGroup) => void;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">평형별 한눈 비교</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">비교할 평형을 누르면 실제 호가 위치와 단지별 순위를 자세히 볼 수 있습니다.</p>
      </div>
      {options.map((option) => {
        const summaries = sortedByMedian(summariesForArea(option.key));
        if (!summaries.length) return null;
        const lowestListing = [...summaries].sort((a, b) => a.min_price - b.min_price)[0];
        const lowestMedian = summaries[0];
        const listingCount = summaries.reduce((total, summary) => total + summary.listing_count, 0);

        return (
          <button key={option.key} type="button" className="block w-full text-left" onClick={() => onSelect(option.key)}>
            <Card className="p-4 transition active:scale-[0.99] sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900">{option.label}</h3>
                  <p className="mt-1 text-xs text-slate-400">{summaries.length}개 단지 · 매물 {listingCount}건</p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-slate-300" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-2xl bg-brand-50 p-3">
                  <p className="text-[11px] font-semibold text-brand-600">최저 호가</p>
                  <p className="metric-number mt-1 text-lg font-bold text-brand-700">{formatPrice(lowestListing.min_price)}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{lowestListing.complex_name}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] font-semibold text-slate-500">중앙값 최저</p>
                  <p className="metric-number mt-1 text-lg font-bold text-slate-800">{formatPrice(lowestMedian.median_price)}</p>
                  <p className="mt-1 truncate text-[11px] text-slate-500">{lowestMedian.complex_name}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5 border-t border-slate-100 pt-3">
                {summaries.map((summary, index) => (
                  <div key={summary.complex_id} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="flex min-w-0 items-center gap-1.5 text-slate-500">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: summary.complex_color }} />
                      <span className="truncate">{summary.complex_name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <strong className="metric-number text-xs text-slate-700">{formatPrice(summary.median_price)}</strong>
                      <span className={index === 0 ? 'text-brand-600' : 'text-red-400'}>
                        {index === 0 ? '기준' : priceDifference(summary.median_price, lowestMedian.median_price)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </button>
        );
      })}
    </section>
  );
}

export function SelectedAreaHighlights({ summaries }: { summaries: ListingAreaSummary[] }) {
  if (!summaries.length) return null;
  const medianRank = sortedByMedian(summaries);
  const lowestMedian = medianRank[0];
  const lowestListing = [...summaries].sort((a, b) => a.min_price - b.min_price)[0];
  const widestRange = [...summaries].sort((a, b) => (b.max_price - b.min_price) - (a.max_price - a.min_price))[0];

  return (
    <Card className="grid grid-cols-3 gap-2 p-3 shadow-none sm:p-5">
      <div className="min-w-0 rounded-2xl bg-brand-50 px-2.5 py-3">
        <p className="text-[10px] font-semibold text-brand-600">전체 최저</p>
        <p className="metric-number mt-1 truncate text-base font-bold text-brand-700">{formatPrice(lowestListing.min_price)}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500">{lowestListing.complex_name}</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-slate-50 px-2.5 py-3">
        <p className="text-[10px] font-semibold text-slate-500">중앙값 최저</p>
        <p className="metric-number mt-1 truncate text-base font-bold text-slate-800">{formatPrice(lowestMedian.median_price)}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500">{lowestMedian.complex_name}</p>
      </div>
      <div className="min-w-0 rounded-2xl bg-slate-50 px-2.5 py-3">
        <p className="text-[10px] font-semibold text-slate-500">범위 최대</p>
        <p className="metric-number mt-1 truncate text-base font-bold text-slate-800">{formatPrice(widestRange.max_price - widestRange.min_price)}</p>
        <p className="mt-1 truncate text-[10px] text-slate-500">{widestRange.complex_name}</p>
      </div>
    </Card>
  );
}

export function ComplexPriceRanking({ summaries }: { summaries: ListingAreaSummary[] }) {
  const ranking = sortedByMedian(summaries);
  if (!ranking.length) return null;
  const baseline = ranking[0].median_price;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-bold">단지별 중앙 호가 순위</h2>
        <p className="mt-1 text-xs text-slate-500">중앙값이 낮은 단지를 기준으로 가격 차이를 표시합니다.</p>
      </div>
      {ranking.map((summary, index) => {
        const difference = summary.median_price - baseline;
        const differenceRate = baseline ? (difference / baseline) * 100 : null;
        return (
          <Card key={summary.complex_id} className="overflow-hidden p-0 sm:p-0">
            <div className="flex">
              <span className="w-1.5 shrink-0" style={{ backgroundColor: summary.complex_color }} />
              <div className="min-w-0 flex-1 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-400">{index + 1}</span>
                      <p className="truncate text-sm font-bold text-slate-900">{summary.complex_name}</p>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-400">매물 {summary.listing_count}건</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="metric-number text-lg font-bold text-slate-900">{formatPrice(summary.median_price)}</p>
                    <p className={`text-[11px] font-semibold ${index === 0 ? 'text-brand-600' : 'text-red-500'}`}>
                      {index === 0 ? '비교 기준' : `${priceDifference(summary.median_price, baseline)} (${formatRate(differenceRate)})`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 divide-x divide-slate-100 rounded-2xl bg-slate-50 py-2.5 text-center">
                  <div>
                    <p className="text-[10px] text-slate-400">최저</p>
                    <p className="metric-number mt-1 text-xs font-bold text-brand-700">{formatPrice(summary.min_price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">중앙</p>
                    <p className="metric-number mt-1 text-xs font-bold text-slate-800">{formatPrice(summary.median_price)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">최고</p>
                    <p className="metric-number mt-1 text-xs font-bold text-slate-800">{formatPrice(summary.max_price)}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
