import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApartmentComplex } from '../../complexes/types';
import type { ApartmentListing, AreaGroup } from '../../listings/types';
import { getAreaGroup } from '../../../shared/utils/area';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

const COLORS = ['#3182f6', '#16a34a', '#8b5cf6', '#f97316', '#db2777'];

export function PriceBucketChart({
  listings,
  complexes,
  complexIds,
  areaGroup,
}: {
  listings: ApartmentListing[];
  complexes: ApartmentComplex[];
  complexIds: string[];
  areaGroup: AreaGroup;
}) {
  const priced = listings.filter(
    (listing): listing is ApartmentListing & { price: number } =>
      listing.deal_type === '매매' &&
      listing.price !== null &&
      complexIds.includes(listing.complex_id) &&
      getAreaGroup(listing) === areaGroup,
  );
  if (!priced.length) return null;
  const step = 50_000_000;
  const start = Math.floor(Math.min(...priced.map((listing) => listing.price)) / step) * step;
  const end = Math.ceil((Math.max(...priced.map((listing) => listing.price)) + 1) / step) * step;
  const names = new Map(complexes.map((complex) => [complex.id, complex.name]));
  const data = [];
  for (let min = start; min < end; min += step) {
    const item: Record<string, string | number> = {
      name: `${(min / 100_000_000).toFixed(1)}~${((min + step) / 100_000_000).toFixed(1)}억`,
    };
    complexIds.forEach((id) => {
      item[id] = priced.filter((listing) => listing.complex_id === id && listing.price >= min && listing.price < min + step).length;
    });
    data.push(item);
  }

  return (
    <Card>
      <h2 className="text-base font-semibold">가격대별 매물 집중도</h2>
      <p className="mt-1 text-xs text-slate-400">5,000만원 구간별로 어느 단지의 매물이 모여 있는지 확인합니다.</p>
      <div className="mt-5 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -26, right: 4 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="name" fontSize={10} stroke="#94a3b8" />
            <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
            <Tooltip formatter={(value: number, key: string) => [`${value}건`, names.get(key) ?? key]} />
            <Legend formatter={(value) => names.get(String(value)) ?? value} wrapperStyle={{ fontSize: 11 }} />
            {complexIds.map((id, index) => (
              <Bar key={id} dataKey={id} stackId="count" fill={COLORS[index % COLORS.length]} radius={index === complexIds.length - 1 ? [5, 5, 0, 0] : undefined} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        전체 범위 {formatPrice(start)} ~ {formatPrice(end)}
      </p>
    </Card>
  );
}
