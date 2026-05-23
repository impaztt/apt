import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { ApartmentListing, AreaSelection } from '../../listings/types';
import { getAreaGroup } from '../../../shared/utils/area';
import { Card } from '../../../shared/components/Card';

const buckets = [
  { label: '6억 미만', min: 0, max: 600_000_000 },
  { label: '6억대', min: 600_000_000, max: 700_000_000 },
  { label: '7억대', min: 700_000_000, max: 800_000_000 },
  { label: '8억대', min: 800_000_000, max: 900_000_000 },
  { label: '9억대', min: 900_000_000, max: 1_000_000_000 },
  { label: '10억+', min: 1_000_000_000, max: Number.POSITIVE_INFINITY },
];

export function DistributionChart({
  listings,
  complexIds,
  areaGroup,
}: {
  listings: ApartmentListing[];
  complexIds: string[];
  areaGroup: AreaSelection;
}) {
  const relevantListings = listings.filter(
    (listing) =>
      listing.deal_type === '매매' &&
      listing.price !== null &&
      complexIds.includes(listing.complex_id) &&
      (areaGroup === 'all' || getAreaGroup(listing) === areaGroup),
  );
  const data = buckets.map((bucket) => ({
    name: bucket.label,
    count: relevantListings.filter((listing) => (listing.price as number) >= bucket.min && (listing.price as number) < bucket.max).length,
  }));

  return (
    <Card>
      <h2 className="text-base font-semibold">{areaGroup === 'all' ? '전체 평형 가격 분포' : '매물 가격 분포'}</h2>
      <div className="mt-5 h-60">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: -24, right: 6 }}>
            <CartesianGrid stroke="#edf1f7" vertical={false} />
            <XAxis dataKey="name" fontSize={11} stroke="#94a3b8" />
            <YAxis allowDecimals={false} fontSize={11} stroke="#94a3b8" />
            <Tooltip formatter={(value: number) => [`${value}건`, '매물 수']} />
            <Bar dataKey="count" fill="#86b9ff" radius={[7, 7, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
