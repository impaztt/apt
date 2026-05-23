import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApartmentComplex } from '../../complexes/types';
import type { ListingAreaSummary } from '../../listings/types';
import { Card } from '../../../shared/components/Card';

export function ListingCountChart({
  summaries,
  complexes,
}: {
  summaries: ListingAreaSummary[];
  complexes: ApartmentComplex[];
}) {
  const names = new Map(complexes.map((complex) => [complex.id, complex.name]));
  const data = summaries.map((summary) => ({
    id: summary.complex_id,
    name: summary.complex_name.length > 7 ? `${summary.complex_name.slice(0, 7)}...` : summary.complex_name,
    count: summary.listing_count,
  }));
  if (!data.length) return null;

  return (
    <Card>
      <h2 className="text-base font-semibold">단지별 매물 수</h2>
      <p className="mt-1 text-xs text-slate-400">1건뿐인 가격은 표본이 부족하므로 범위 해석 시 주의합니다.</p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -26, right: 4 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
            <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
            <Tooltip
              formatter={(value: number, _key, item) => [
                `${value}건${value === 1 ? ' (표본 부족)' : ''}`,
                names.get((item.payload as (typeof data)[number]).id) ?? '단지',
              ]}
            />
            <Bar dataKey="count" fill="#3182f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
