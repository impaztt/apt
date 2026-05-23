import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ListingAreaSummary } from '../../listings/types';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

export function AveragePriceChart({ summaries, showArea = false }: { summaries: ListingAreaSummary[]; showArea?: boolean }) {
  const data = summaries.map((summary) => ({
    name: `${summary.complex_name.length > 6 ? `${summary.complex_name.slice(0, 6)}…` : summary.complex_name}${
      showArea ? `/${summary.area_pyeong}평` : ''
    }`,
    label: `${summary.complex_name} · ${summary.area_label}`,
    average: summary.avg_price / 100_000_000,
    raw: summary.avg_price,
  }));

  return (
    <Card>
      <h2 className="text-base font-semibold">{showArea ? '단지·평형별 평균 호가' : '평균 호가 비교'}</h2>
      <div className={`mt-5 ${showArea ? 'h-72' : 'h-60'}`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -20, right: 8 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
            <YAxis tickFormatter={(value: number) => `${value}억`} fontSize={11} stroke="#94a3b8" />
            <Tooltip formatter={(_value, _key, item) => {
              const payload = item.payload as (typeof data)[number];
              return [`${payload.label}: ${formatPrice(payload.raw)}`, '평균 호가'];
            }} />
            <Bar dataKey="average" fill="#131b2b" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
