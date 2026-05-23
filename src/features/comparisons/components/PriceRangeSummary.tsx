import type { ListingAreaSummary } from '../../listings/types';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

const COLORS = ['#3182f6', '#8b5cf6', '#16a34a', '#f97316'];

export function PriceRangeSummary({ summaries, title = '단지별 호가 범위' }: { summaries: ListingAreaSummary[]; title?: string }) {
  if (!summaries.length) return null;
  const minimum = Math.min(...summaries.map((summary) => summary.min_price));
  const maximum = Math.max(...summaries.map((summary) => summary.max_price));
  const padding = Math.max((maximum - minimum) * 0.05, 10_000_000);
  const start = Math.max(0, minimum - padding);
  const end = maximum + padding;
  const position = (price: number) => ((price - start) / (end - start || 1)) * 100;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-bold">{title}</h2>
      <p className="mt-1 text-[11px] text-slate-400">막대는 최저~최고 호가, 세로 표시는 중앙값입니다.</p>
      <div className="mt-5 space-y-5">
        {summaries.map((summary, index) => {
          const color = COLORS[index % COLORS.length];
          return (
            <div key={summary.complex_id}>
              <div className="flex justify-between gap-3 text-xs">
                <p className="truncate font-semibold text-slate-700">{summary.complex_name}</p>
                <p className="shrink-0 text-slate-500">{summary.listing_count}건</p>
              </div>
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
              <div className="mt-2 flex justify-between text-[11px] text-slate-500">
                <span>최저 <strong className="text-brand-700">{formatPrice(summary.min_price)}</strong></span>
                <span>중앙 <strong className="text-slate-800">{formatPrice(summary.median_price)}</strong></span>
                <span>최고 <strong className="text-slate-800">{formatPrice(summary.max_price)}</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
