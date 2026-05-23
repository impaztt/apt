import { useState } from 'react';
import { DistributionChart } from '../features/comparisons/components/DistributionChart';
import { AveragePriceChart } from '../features/comparisons/components/AveragePriceChart';
import { PriceRangeChart } from '../features/comparisons/components/PriceRangeChart';
import { getGroupAverage, getRelativeRate, summarizeListings } from '../features/listings/statistics';
import type { AreaGroup } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { formatDate } from '../shared/utils/date';
import { formatPrice, formatRate } from '../shared/utils/price';

export function ComparisonPage() {
  const { complexes, listings, groups, memberships, loading, error } = useAppData();
  const [groupId, setGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaGroup>('84');
  const group = groups.find((item) => item.id === groupId) ?? groups[0];
  const complexIds = memberships
    .filter((item) => item.group_id === group?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((item) => item.complex_id);
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds);
  const groupAverage = getGroupAverage(summaries);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) {
    return <EmptyState title="비교 그룹이 없습니다" description="먼저 그룹 관리에서 단지를 추가해 주세요." />;
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="평형별 비교"
        description="같은 전용면적대의 매매 호가 분포와 상대 가격을 비교합니다."
        action={
          <select
            className="field-control mt-0 min-w-[240px]"
            value={group?.id ?? ''}
            onChange={(event) => setGroupId(event.target.value)}
          >
            {groups.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        }
      />

      <AreaTabs value={areaGroup} onChange={setAreaGroup} />

      {summaries.length ? (
        <>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {summaries.map((summary, index) => {
              const relativeRate = getRelativeRate(summary.avg_price, groupAverage);
              return (
                <Card key={summary.complex_id}>
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-5">{summary.complex_name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500">
                      {index + 1}위
                    </span>
                  </div>
                  <p className="metric-number mt-5 text-2xl font-bold">{formatPrice(summary.avg_price)}</p>
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      (relativeRate ?? 0) > 0 ? 'text-red-500' : 'text-brand-600'
                    }`}
                  >
                    그룹 평균 대비 {formatRate(relativeRate)}
                  </p>
                  <dl className="mt-5 grid grid-cols-2 gap-y-3 text-xs">
                    <dt className="text-slate-400">최저가</dt>
                    <dd className="text-right font-medium text-brand-600">{formatPrice(summary.min_price)}</dd>
                    <dt className="text-slate-400">최고가</dt>
                    <dd className="text-right font-medium">{formatPrice(summary.max_price)}</dd>
                    <dt className="text-slate-400">중앙값</dt>
                    <dd className="text-right font-medium">{formatPrice(summary.median_price)}</dd>
                    <dt className="text-slate-400">㎡당 / 평당</dt>
                    <dd className="text-right font-medium">
                      {formatPrice(summary.price_per_m2)} / {formatPrice(summary.price_per_pyeong)}
                    </dd>
                    <dt className="text-slate-400">매물/확인</dt>
                    <dd className="text-right font-medium">
                      {summary.listing_count}건 · {formatDate(summary.latest_verified_date)}
                    </dd>
                  </dl>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <PriceRangeChart summaries={summaries} />
            <AveragePriceChart summaries={summaries} />
            <DistributionChart listings={listings} complexIds={complexIds} areaGroup={areaGroup} />
            <Card className="flex flex-col justify-center bg-slate-50 shadow-none">
              <p className="text-xs font-semibold text-slate-400">해석 안내</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                선택 평형의 그룹 전체 평균 호가는 <strong className="text-ink">{formatPrice(groupAverage)}</strong>입니다.
                표시 순위는 평균 호가가 낮은 순이며, 입지·층·향·매물 중복 여부를 반영한 투자 판단 지표가 아닙니다.
              </p>
            </Card>
          </div>
        </>
      ) : (
        <EmptyState title="비교할 매물이 없습니다" description={`선택한 전용 ${areaGroup}㎡ 매매 매물을 등록해 주세요.`} />
      )}
    </div>
  );
}
