import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ListingTrendPoint } from '../../listings/types';
import { formatPrice } from '../../../shared/utils/price';
import { Card } from '../../../shared/components/Card';

const COLORS = ['#3182f6', '#16a34a', '#8b5cf6', '#f97316', '#db2777'];

type Metric = 'median_price' | 'min_price' | 'listing_count';

export function TrendLineChart({
  points,
  complexIds,
  metric,
  title,
}: {
  points: ListingTrendPoint[];
  complexIds: string[];
  metric: Metric;
  title: string;
}) {
  const names = new Map(points.map((point) => [point.complex_id, point.complex_name]));
  const rows = [...new Set(points.map((point) => point.captured_date))].map((date) => {
    const row: Record<string, string | number | null> = { date: date.slice(5).replace('-', '.') };
    complexIds.forEach((complexId) => {
      const point = points.find((item) => item.captured_date === date && item.complex_id === complexId);
      row[complexId] = point ? (metric === 'listing_count' ? point[metric] : point[metric] / 100_000_000) : null;
    });
    return row;
  });
  if (!rows.length) return null;

  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      <div className="mt-4 flex gap-3 overflow-x-auto pb-1 text-[11px] text-slate-500">
        {complexIds.map((complexId, index) => (
          <span key={complexId} className="flex shrink-0 items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
            {names.get(complexId) ?? complexId}
          </span>
        ))}
      </div>
      <div className="mt-3 h-52 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ left: metric === 'listing_count' ? -22 : -10, right: 10 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="date" fontSize={11} stroke="#94a3b8" />
            <YAxis
              allowDecimals={metric !== 'listing_count'}
              fontSize={11}
              stroke="#94a3b8"
              tickFormatter={(value: number) => (metric === 'listing_count' ? `${value}` : `${value}억`)}
            />
            <Tooltip
              formatter={(value: number, key: string) => [
                metric === 'listing_count' ? `${value}건` : formatPrice(value * 100_000_000),
                names.get(key) ?? key,
              ]}
            />
            {complexIds.map((complexId, index) => (
              <Line
                key={complexId}
                type="monotone"
                dataKey={complexId}
                connectNulls={false}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
