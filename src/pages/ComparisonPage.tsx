import { useEffect, useState } from 'react';
import { ListingCountChart } from '../features/comparisons/components/ListingCountChart';
import { ListingDistributionPlot } from '../features/comparisons/components/ListingDistributionPlot';
import { PriceBucketChart } from '../features/comparisons/components/PriceBucketChart';
import { getRelativeRate, summarizeListings } from '../features/listings/statistics';
import type { AreaSelection } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { getAreaOptions } from '../shared/utils/area';
import { formatDate } from '../shared/utils/date';
import { formatPrice, formatRate } from '../shared/utils/price';

export function ComparisonPage() {
  const { complexes, listings, groups, memberships, latestCapturedDates, loading, error } = useAppData();
  const [groupId, setGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaSelection>('all');
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const complexIds = memberships
    .filter((item) => item.group_id === group?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.complex_id);
  const relevantListings = listings.filter((listing) => complexIds.includes(listing.complex_id));
  const areaOptions = getAreaOptions(relevantListings.filter((listing) => listing.deal_type === '매매'));
  const selectedArea = areaOptions.find((area) => area.key === areaGroup);
  const scopeLabel = selectedArea?.label ?? '전체 평형';
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds);
  const totalListings = summaries.reduce((total, summary) => total + summary.listing_count, 0);
  const groupCenter =
    areaGroup === 'all' || !totalListings
      ? null
      : summaries.reduce((total, summary) => total + summary.median_price * summary.listing_count, 0) / totalListings;

  useEffect(() => {
    if (areaGroup !== 'all' && !areaOptions.some((option) => option.key === areaGroup)) setAreaGroup('all');
  }, [areaGroup, areaOptions]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) return <EmptyState title="비교 그룹이 없습니다" description="먼저 단지 데이터를 추가해 주세요." />;

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title="단지별 비교"
        description="평형을 고르면 실제 매물 분포와 표본 수를 중심으로 단지를 비교합니다."
        action={
          <select className="field-control mt-0 w-full sm:min-w-[240px]" value={group?.id ?? ''} onChange={(event) => setGroupId(event.target.value)}>
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        }
      />

      <AreaTabs value={areaGroup} options={areaOptions} onChange={setAreaGroup} />

      {summaries.length ? areaGroup === 'all' ? (
        <section className="space-y-4">
          <Card className="bg-brand-50 p-4 shadow-none sm:p-6">
            <p className="text-sm font-semibold text-brand-700">전체 평형 비교</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">평형마다 가격 축이 다르므로 각 카드 안에서 단지별 분포를 비교하세요. 동일 평형끼리의 비교가 기준입니다.</p>
          </Card>
          {areaOptions.map((option) => (
            <ListingDistributionPlot
              key={option.key}
              listings={listings}
              complexes={complexes}
              complexIds={complexIds}
              areaGroup={option.key}
              title={option.label}
            />
          ))}
        </section>
      ) : (
        <>
          <Card className="p-4 shadow-none sm:p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{scopeLabel} 비교 기준일</p>
              <span className="text-xs text-slate-400">매매 호가</span>
            </div>
            <div className="mt-3 space-y-2 text-xs text-slate-500">
              {complexIds.map((id) => (
                <p key={id} className="flex justify-between gap-3">
                  <span className="truncate">{complexes.find((complex) => complex.id === id)?.name ?? id}</span>
                  <span className="shrink-0">{formatDate(latestCapturedDates[id] ?? null)}</span>
                </p>
              ))}
            </div>
          </Card>

          <ListingDistributionPlot
            listings={listings}
            complexes={complexes}
            complexIds={complexIds}
            areaGroup={areaGroup}
            title={`${scopeLabel} 호가 분포`}
          />

          <div className="grid gap-4 xl:grid-cols-2">
            <PriceBucketChart listings={listings} complexes={complexes} complexIds={complexIds} areaGroup={areaGroup} />
            <ListingCountChart summaries={summaries} complexes={complexes} />
          </div>

          <section>
            <h2 className="mb-3 text-base font-bold">단지별 중심 가격</h2>
            <div className="space-y-2">
              {[...summaries].sort((a, b) => a.median_price - b.median_price).map((summary, index) => {
                const relativeRate = getRelativeRate(summary.median_price, groupCenter);
                return (
                  <Card key={summary.complex_id} className="p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{index + 1}. {summary.complex_name}</p>
                        <p className="mt-1 text-xs text-slate-400">매물 {summary.listing_count}건 · 최저 {formatPrice(summary.min_price)} ~ 최고 {formatPrice(summary.max_price)}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="metric-number text-lg font-bold">{formatPrice(summary.median_price)}</p>
                        <p className={`text-xs font-semibold ${(relativeRate ?? 0) > 0 ? 'text-red-500' : 'text-brand-600'}`}>
                          그룹 중심 대비 {formatRate(relativeRate)}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        <EmptyState title="비교할 매물이 없습니다" description="선택한 평형의 매매 스냅샷을 저장해 주세요." />
      )}
    </div>
  );
}
