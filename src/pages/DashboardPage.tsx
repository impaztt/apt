import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { ListingDotsDisclosure } from '../features/comparisons/components/ListingDotsDisclosure';
import { PriceDistributionMatrix } from '../features/comparisons/components/PriceDistributionMatrix';
import { PriceRangeSummary } from '../features/comparisons/components/PriceRangeSummary';
import { summarizeListings } from '../features/listings/statistics';
import type { AreaSelection } from '../features/listings/types';
import { AreaTabs } from '../shared/components/AreaTabs';
import { Card } from '../shared/components/Card';
import { MetricCard } from '../shared/components/MetricCard';
import { PageHeader } from '../shared/components/PageHeader';
import { EmptyState, ErrorState, LoadingState } from '../shared/components/States';
import { useAppData } from '../shared/data/AppDataContext';
import { getAreaGroup, getAreaOptions } from '../shared/utils/area';
import { formatDate } from '../shared/utils/date';
import { formatPrice } from '../shared/utils/price';

export function DashboardPage() {
  const { complexes, listings, groups, memberships, latestCapturedDates, loading, error } = useAppData();
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [areaGroup, setAreaGroup] = useState<AreaSelection>('all');
  const activeGroup = groups.find((group) => group.id === selectedGroupId) ?? groups[0];
  const complexIds = memberships
    .filter((membership) => membership.group_id === activeGroup?.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((membership) => membership.complex_id);
  const relevantListings = listings.filter((listing) => complexIds.includes(listing.complex_id));
  const saleListings = relevantListings.filter((listing) => listing.deal_type === '매매' && listing.price !== null);
  const areaOptions = getAreaOptions(saleListings);
  const selectedArea = areaOptions.find((area) => area.key === areaGroup);
  const scopeLabel = areaGroup === 'all' ? '전체 평형' : selectedArea?.label ?? '선택 평형';
  const summaries = summarizeListings(listings, complexes, areaGroup, complexIds);
  const selectedListings =
    areaGroup === 'all' ? saleListings : saleListings.filter((listing) => getAreaGroup(listing) === areaGroup);
  const lowest = summaries.length ? Math.min(...summaries.map((summary) => summary.min_price)) : null;
  const capturedDates = complexIds.map((id) => latestCapturedDates[id]).filter((date): date is string => Boolean(date));
  const latestCapturedDate = [...capturedDates].sort().pop() ?? null;
  const differingDates = new Set(capturedDates).size > 1;
  const lowPriceListings = [...selectedListings]
    .filter((listing): listing is typeof listing & { price: number } => listing.price !== null)
    .sort((a, b) => a.price - b.price)
    .slice(0, 6);

  useEffect(() => {
    if (areaGroup !== 'all' && !areaOptions.some((option) => option.key === areaGroup)) setAreaGroup('all');
  }, [areaGroup, areaOptions]);

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!groups.length) return <EmptyState title="비교 그룹이 없습니다" description="비교할 단지를 JSON에 등록해 주세요." />;

  return (
    <div className="space-y-5 sm:space-y-7">
      <PageHeader
        title={activeGroup?.name ?? '호가 분포 대시보드'}
        description="평형별 가격 구간에 매물이 몇 건 몰려 있는지 단지별로 비교합니다."
        action={
          <select
            className="field-control mt-0 w-full sm:min-w-[240px]"
            value={activeGroup?.id ?? ''}
            onChange={(event) => setSelectedGroupId(event.target.value)}
          >
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        }
      />

      <AreaTabs value={areaGroup} options={areaOptions} onChange={setAreaGroup} />

      {summaries.length ? (
        <>
          {areaGroup === 'all' ? (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">평형별 가격대 분포</h2>
                  <p className="mt-1 text-sm text-slate-500">셀 색과 건수로 어느 가격대에 매물이 몰리는지 확인하세요.</p>
                </div>
              </div>
              {areaOptions.map((option) => {
                const areaSummaries = summarizeListings(listings, complexes, option.key, complexIds);
                return (
                  <div key={option.key} className="space-y-3">
                    <PriceDistributionMatrix
                      listings={listings}
                      complexes={complexes}
                      complexIds={complexIds}
                      areaGroup={option.key}
                      title={option.label}
                      trendsLink={`/trends?area=${encodeURIComponent(option.key)}`}
                    />
                    <PriceRangeSummary summaries={areaSummaries} title={`${option.label} 단지별 호가 범위`} />
                  </div>
                );
              })}
            </section>
          ) : (
            <>
              <PriceDistributionMatrix
                listings={listings}
                complexes={complexes}
                complexIds={complexIds}
                areaGroup={areaGroup}
                title={`${scopeLabel} 가격대별 매물 분포`}
                trendsLink={`/trends?area=${encodeURIComponent(areaGroup)}`}
              />
              <PriceRangeSummary summaries={summaries} />
              <ListingDotsDisclosure listings={listings} complexes={complexes} complexIds={complexIds} areaGroup={areaGroup} />
            </>
          )}

          <section className="space-y-3">
            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <MetricCard label="비교 단지" value={`${complexIds.length}개`} note={`매매 매물 ${saleListings.length}건`} />
              <MetricCard label={`${scopeLabel} 매물`} value={`${selectedListings.length}건`} note="가격 구간 분포 기준" />
              {areaGroup === 'all' ? (
                <MetricCard label="등록 평형" value={`${areaOptions.length}개`} note="평형별 분포 확인" />
              ) : (
                <MetricCard label={`${scopeLabel} 최저가`} value={formatPrice(lowest)} tone="blue" note="현재 관측 최저 호가" />
              )}
              <MetricCard label="최신 수집일" value={formatDate(latestCapturedDate)} note="업로드 기준일" />
            </div>
            <Card className={`p-4 shadow-none sm:p-6 ${differingDates ? 'border border-amber-100 bg-amber-50' : 'bg-brand-50'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <details className="min-w-0 flex-1">
                  <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700">단지별 수집 기준일 확인</summary>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-500">
                    {complexIds.map((id) => (
                      <p key={id} className="flex justify-between gap-3">
                        <span className="truncate">{complexes.find((item) => item.id === id)?.name ?? id}</span>
                        <span className="shrink-0">{formatDate(latestCapturedDates[id] ?? null)}</span>
                      </p>
                    ))}
                  </div>
                  {differingDates && <p className="mt-2 text-xs font-semibold text-amber-700">단지별 최신 수집일이 다릅니다.</p>}
                </details>
                <Link to={areaGroup === 'all' ? '/trends' : `/trends?area=${encodeURIComponent(areaGroup)}`} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-brand-700">
                  <TrendingUp className="h-4 w-4" /> 호가 변화
                </Link>
              </div>
            </Card>
          </section>

          {areaGroup !== 'all' && (
            <section>
              <h2 className="mb-4 text-lg font-bold">{scopeLabel} 저가순 매물 확인</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {lowPriceListings.map((listing) => {
                  const complex = complexes.find((item) => item.id === listing.complex_id);
                  return (
                    <Card key={listing.id}>
                      <p className="text-sm font-semibold">{complex?.name ?? '단지'}</p>
                      <p className="metric-number mt-4 text-2xl font-bold text-brand-700">{formatPrice(listing.price)}</p>
                      <p className="mt-3 text-xs text-slate-500">
                        {listing.building_no ?? '-'} · {listing.floor_text ?? '층 미입력'} · {listing.direction ?? '방향 미입력'}
                      </p>
                      <p className="mt-2 text-xs text-slate-400">확인 {formatDate(listing.verified_date)}</p>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          <p className="px-1 text-xs leading-5 text-slate-400">호가는 매도 희망 가격이며 실거래가 또는 매수·매도 추천 지표가 아닙니다.</p>
        </>
      ) : (
        <EmptyState title={`${scopeLabel} 매물이 없습니다`} description="JSON 입력에서 수집일별 매물 스냅샷을 저장해 주세요." />
      )}
    </div>
  );
}
