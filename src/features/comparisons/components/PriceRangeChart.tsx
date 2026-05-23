import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ListingAreaSummary } from '../../listings/types';
import { formatCompactPrice, formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

export function PriceRangeChart({ summaries }: { summaries: ListingAreaSummary[] }) {
  const data = summaries.map((summary) => ({
    name: summary.complex_name.length > 10 ? `${summary.complex_name.slice(0, 10)}…` : summary.complex_name,
    range: [summary.min_price / 100_000_000, summary.max_price / 100_000_000],
    average: summary.avg_price,
    minimum: summary.min_price,
    maximum: summary.max_price,
  }));

  return (
    <Card>
      <h2 className="text-base font-semibold">단지별 가격 범위</h2>
      <p className="mt-1 text-xs text-slate-400">최저가부터 최고가까지의 현재 매매 호가 범위입니다.</p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 20 }}>
            <CartesianGrid stroke="#edf1f7" horizontal={false} />
            <XAxis type="number" tickFormatter={(value: number) => `${value}억`} fontSize={11} stroke="#94a3b8" />
            <YAxis dataKey="name" type="category" width={90} fontSize={11} stroke="#94a3b8" />
            <Tooltip
              cursor={{ fill: '#f8fafc' }}
              formatter={(_value, _key, item) => {
                const payload = item.payload as (typeof data)[number];
                return [`${formatPrice(payload.minimum)} ~ ${formatPrice(payload.maximum)} (평균 ${formatPrice(payload.average)})`, '호가'];
              }}
            />
            <Bar dataKey="range" fill="#3182f6" radius={[8, 8, 8, 8]} barSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {summaries.length > 0 && (
        <p className="mt-3 text-xs text-slate-400">
          평균 최저 {formatCompactPrice(Math.min(...summaries.map((item) => item.avg_price)))} · 평균 최고{' '}
          {formatCompactPrice(Math.max(...summaries.map((item) => item.avg_price)))}
        </p>
      )}
    </Card>
  );
}
